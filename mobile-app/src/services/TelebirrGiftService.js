import api from '../api';

/**
 * TelebirrGiftService - Handles gift purchases and transfers via official FlipStar endpoints:
 * - GET  /gifts/                                      (gift list)
 * - POST /gift-purchases/quote/                       (quote for gift purchase)
 * - POST /gift-purchases/                             (initiate purchase with telebirr_ussd)
 * - GET  /gift-purchases/<reference>/                 (poll until is_final: true)
 * - POST /gift-purchases/<reference>/cancel/          (cancel while pending)
 * - GET  /gift-purchases/                             (my gift purchases)
 * - GET  /wallet/transactions/?type=gift_sent         (gift sent transactions)
 * - GET  /wallet/transactions/?type=gift_received     (gift received transactions)
 */
class TelebirrGiftService {
  constructor() {
    this.cachedUserPhone = null;
  }

  /**
   * RFC4122 v4 compliant UUID generator for client_request_id
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate a unique transaction reference (e.g. GFT...)
   */
  generateReference() {
    const chars = '0123456789ABCDEF';
    let hex = '';
    for (let i = 0; i < 22; i++) {
      hex += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `GFT${hex}`;
  }

  /**
   * Fetch current authenticated user's phone number for telebirr USSD Push
   */
  async getUserPhone() {
    if (this.cachedUserPhone) return this.cachedUserPhone;
    try {
      const prof = await api.getProfile();
      const phone =
        prof?.phone_number ||
        prof?.phone ||
        prof?.user?.phone_number ||
        prof?.username ||
        '';
      if (phone) {
        this.cachedUserPhone = phone;
        return phone;
      }
    } catch (e) {
      // Ignore
    }
    return '';
  }

  /**
   * GET /gifts/ - Fetch list of available gifts
   */
  async getGifts() {
    try {
      const res = await api.request('/gifts/');
      const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return list;
    } catch (err) {
      console.warn('🎁 [TelebirrGiftService] Failed to load gifts list:', err?.message);
      return [];
    }
  }

  /**
   * POST /gift-purchases/quote/ - Get price/fee quote before purchase
   * Body: {"gift_id": 1, "quantity": 1, "recipient_username": "abebe", "reel_id": 42}
   */
  async getQuote(giftId, quantity = 1, recipientUsername = '', reelId = null) {
    const cleanUsername = String(recipientUsername || '').replace(/^@/, '').trim();
    const payload = {
      gift_id: parseInt(giftId, 10),
      quantity: parseInt(quantity, 10) || 1,
      recipient_username: cleanUsername,
      ...(reelId ? { reel_id: parseInt(reelId, 10) } : {}),
    };

    try {
      console.log('🎁 [TelebirrGiftService -> POST /gift-purchases/quote/]:', payload);
      const res = await api.request('/gift-purchases/quote/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('🎁 [/gift-purchases/quote/ SUCCESS]:', res);
      return { success: true, data: res };
    } catch (err) {
      console.warn('🎁 [/gift-purchases/quote/ error]:', err?.status, err?.message);
      return {
        success: false,
        error: err?.data?.error || err?.message || 'Failed to get gift quote',
        data: null,
      };
    }
  }

  /**
   * POST /gift-purchases/ - Initiate gift purchase
   * Body: {"gift_id": 1, "quantity": 1, "recipient_username": "abebe", "reel_id": 42, "message": "Great post!", "payment_method": "telebirr_ussd", "client_request_id": "<new uuid>"}
   */
  async initiateGiftPayment(
    giftId,
    recipientUsername,
    amountETB,
    reference,
    quantity = 1,
    message = '',
    reelId = null,
    phoneNumber = null,
    paymentMethod = 'telebirr_ussd'
  ) {
    const cleanUsername = String(recipientUsername || '').replace(/^@/, '').trim();
    const parsedAmount = parseFloat(amountETB) || 0;
    const parsedQty = parseInt(quantity, 10) || 1;
    const clientRequestId = this.generateUUID();

    // Resolve user's phone number for Telebirr
    let userPhone = phoneNumber || this.cachedUserPhone;
    if (!userPhone) {
      userPhone = await this.getUserPhone();
    }

    let formattedPhone = '';
    let localPhone = '';
    if (userPhone) {
      const digits = String(userPhone).replace(/\D/g, '');
      if (digits.length >= 9) {
        const last9 = digits.slice(-9);
        formattedPhone = '251' + last9;
        localPhone = '0' + last9;
      }
    }

    // Backend accepts 'telebirr_ussd' or 'telebirr_h5'
    const validMethod = paymentMethod === 'telebirr_h5' ? 'telebirr_h5' : 'telebirr_ussd';

    const payload = {
      gift_id: parseInt(giftId, 10),
      quantity: parsedQty,
      recipient_username: cleanUsername,
      message: message || '',
      payment_method: validMethod,
      client_request_id: clientRequestId,
      ...(reelId ? { reel_id: parseInt(reelId, 10) } : {}),
      // Complementary helper attributes for server & fallback compatibility
      reference: reference,
      amount_etb: parsedAmount,
      amount: parsedAmount,
      out_trade_no: reference,
      ...(formattedPhone ? {
        phone_number: formattedPhone,
        payer_msisdn: formattedPhone,
        phone: localPhone || formattedPhone,
        msisdn: formattedPhone,
        payer_phone: formattedPhone,
      } : {}),
    };

    let lastError = null;

    // 1. PRIMARY: POST /gift-purchases/
    try {
      console.log('🎁 [TelebirrGiftService -> POST /gift-purchases/]:', payload);
      const res = await api.request('/gift-purchases/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('🎁 [/gift-purchases/ SUCCESS]:', res);

      if (res && res.error && res.success === false) {
        return { success: false, error: res.error, reference, client_request_id: clientRequestId };
      }

      const paymentUrl =
        res?.to_pay_url ||
        res?.to_pay ||
        res?.payment_url ||
        res?.telebirr_url ||
        res?.redirect_url ||
        res?.url ||
        res?.data?.to_pay_url ||
        res?.data?.to_pay ||
        res?.data?.payment_url ||
        res?.data?.telebirr_url ||
        res?.data?.url;

      // Exhaustively extract any identifier returned by the server
      const serverRef =
        res?.reference ||
        res?.purchase_reference ||
        res?.order_id ||
        res?.tracking_id ||
        res?.out_trade_no ||
        res?.data?.reference ||
        res?.data?.purchase_reference ||
        res?.data?.order_id ||
        res?.purchase?.reference ||
        null;

      const serverNumericId =
        res?.id ||
        res?.purchase_id ||
        res?.data?.id ||
        res?.data?.purchase_id ||
        res?.purchase?.id ||
        null;

      const returnedClientId =
        res?.client_request_id ||
        res?.data?.client_request_id ||
        clientRequestId;

      const bestIdentifier = serverRef || (serverNumericId ? String(serverNumericId) : null) || reference;

      return {
        success: true,
        data: res,
        purchase_id: bestIdentifier,
        reference: bestIdentifier,
        server_ref: serverRef,
        server_id: serverNumericId,
        client_request_id: returnedClientId,
        initiated_at: Date.now(),
        is_final: res?.is_final ?? false,
        status: res?.status || 'pending',
        payment_method: validMethod,
        payment_url: paymentUrl || null,
        telebirr_url: paymentUrl || null,
      };
    } catch (err) {
      lastError = err;
      console.warn('🎁 [/gift-purchases/ failed]:', err?.status, err?.message, err?.data);

      // If telebirr_ussd failed, try telebirr_h5 fallback if applicable
      if (validMethod === 'telebirr_ussd' && (err?.status === 400 || err?.status === 502)) {
        try {
          console.log('🎁 [Retrying gift purchase with telebirr_h5...]:', reference);
          const h5Payload = { ...payload, payment_method: 'telebirr_h5' };
          const h5Res = await api.request('/gift-purchases/', {
            method: 'POST',
            body: JSON.stringify(h5Payload),
          });
          if (h5Res && (!h5Res.error || h5Res.success !== false)) {
            const h5Url =
              h5Res?.to_pay_url ||
              h5Res?.to_pay ||
              h5Res?.payment_url ||
              h5Res?.telebirr_url ||
              h5Res?.redirect_url ||
              h5Res?.url;
            const h5ServerRef =
              h5Res?.reference ||
              h5Res?.purchase_reference ||
              h5Res?.data?.reference ||
              null;
            const h5NumericId =
              h5Res?.id ||
              h5Res?.data?.id ||
              null;
            const h5BestId = h5ServerRef || (h5NumericId ? String(h5NumericId) : null) || reference;
            return {
              success: true,
              data: h5Res,
              purchase_id: h5BestId,
              reference: h5BestId,
              server_ref: h5ServerRef,
              server_id: h5NumericId,
              client_request_id: clientRequestId,
              initiated_at: Date.now(),
              is_final: h5Res?.is_final ?? false,
              status: h5Res?.status || 'pending',
              payment_method: 'telebirr_h5',
              payment_url: h5Url || null,
              telebirr_url: h5Url || null,
            };
          }
        } catch (h5Err) {
          console.warn('🎁 [telebirr_h5 fallback failed]:', h5Err?.status, h5Err?.message);
        }
      }

      if (err?.status === 400 || err?.status === 403 || err?.status === 404) {
        const msg =
          err?.data?.error ||
          err?.data?.detail ||
          err?.data?.message ||
          err?.message;
        return {
          success: false,
          error: msg || `Request error (${err?.status})`,
          status: err?.status,
          reference,
          client_request_id: clientRequestId,
        };
      }
    }

    // 2. Fallback to coins gift if telebirr payment fails completely
    try {
      console.log('🎁 [Fallback -> POST /coins/send-gift/]:', payload);
      const res = await api.request('/coins/send-gift/', {
        method: 'POST',
        body: JSON.stringify({
          gift_id: parseInt(giftId, 10),
          recipient_username: cleanUsername,
          quantity: parsedQty,
          message: message || '',
          ...(reelId ? { reel_id: parseInt(reelId, 10) } : {}),
        }),
      });
      if (res && !res.error) {
        return {
          success: true,
          data: res,
          reference,
          client_request_id: clientRequestId,
          is_final: true,
          status: 'completed',
        };
      }
    } catch (err) {
      console.warn('🎁 [/coins/send-gift/ failed]:', err?.status, err?.message);
    }

    const finalErrorMsg =
      lastError?.data?.error ||
      lastError?.data?.detail ||
      lastError?.data?.message ||
      lastError?.message ||
      'Failed to initiate telebirr gift purchase. Please try again.';

    return {
      success: false,
      error: finalErrorMsg,
      status: lastError?.status || 500,
      reference,
      client_request_id: clientRequestId,
    };
  }

  /**
   * Check gift payment status across all official FlipStar endpoints:
   * 1. GET /gift-purchases/<reference>/ (poll by server ref / id)
   * 2. GET /gift-purchases/ (my gift purchases list)
   * 3. GET /wallet/transactions/?type=gift_sent (wallet confirmed transactions)
   * 4. GET /gifts/sent/ (virtual gifts sent history)
   *
   * identifiers: string reference OR { reference, serverId, server_id, clientRequestId, client_request_id, initiatedAt, initiated_at }
   */
  async checkPaymentStatus(identifiers, giftId = null, recipientUsername = null) {
    let reference = '';
    let serverId = null;
    let clientRequestId = null;
    let initiatedAt = Date.now() - 30000;

    if (typeof identifiers === 'object' && identifiers !== null) {
      reference = String(identifiers.reference || identifiers.purchase_id || '');
      serverId = identifiers.server_id || identifiers.serverId || null;
      clientRequestId = identifiers.client_request_id || identifiers.clientRequestId || null;
      if (identifiers.initiated_at || identifiers.initiatedAt) {
        initiatedAt = Number(identifiers.initiated_at || identifiers.initiatedAt);
      }
    } else {
      reference = String(identifiers || '');
    }

    const cleanUser = String(recipientUsername || '').replace(/^@/, '').trim().toLowerCase();

    // ─── 1. Primary: GET /gift-purchases/<reference>/ ────────────────────────
    const candidateEndpoints = [];
    if (serverId) {
      candidateEndpoints.push(`/gift-purchases/${encodeURIComponent(serverId)}/`);
    }
    if (reference) {
      candidateEndpoints.push(`/gift-purchases/${encodeURIComponent(reference)}/`);
    }

    for (const ep of candidateEndpoints) {
      try {
        const response = await api.request(ep, { method: 'GET', silent: true, skipCache: true });
        if (response && !response.error && response.success !== false) {
          const data = response?.data || response;
          const isFinal = Boolean(data?.is_final);
          const rawStatus = String(data?.status || data?.tradeStatus || '').toLowerCase();
          const isSuccess =
            data?.is_success === true ||
            rawStatus === 'completed' ||
            rawStatus === 'success' ||
            rawStatus === 'approved' ||
            rawStatus === 'delivered' ||
            rawStatus === 'paid' ||
            (isFinal && !['failed', 'cancelled', 'rejected', 'expired'].includes(rawStatus));
          const isCancelled = rawStatus === 'cancelled';
          const isFailed = rawStatus === 'failed' || rawStatus === 'declined' || rawStatus === 'rejected' || rawStatus === 'error';

          if (isSuccess || isCancelled || isFailed || isFinal) {
            return {
              success: true,
              data,
              is_final: isFinal || isSuccess || isCancelled || isFailed,
              status: rawStatus || (isSuccess ? 'completed' : 'pending'),
              is_success: isSuccess,
              is_cancelled: isCancelled,
              is_failed: isFailed,
            };
          }
        }
      } catch (err) {
        // Silently continue to next check — 404 is expected if lookup key differs
      }
    }

    // ─── 2. Query My Gift Purchases: GET /gift-purchases/ ────────────────────
    try {
      const listRes = await api.request('/gift-purchases/', { method: 'GET', silent: true, skipCache: true });
      const items = Array.isArray(listRes) ? listRes : listRes?.results || listRes?.data || [];
      if (items.length > 0) {
        const match = items.find((item) => {
          const itemRef = String(item?.reference || item?.id || item?.client_request_id || item?.purchase_reference || '');
          const itemRecipient = String(
            (typeof item?.recipient === 'object' ? item?.recipient?.username : item?.recipient) ||
            item?.recipient_username ||
            item?.recipient_name ||
            item?.receiver_username ||
            item?.to_username ||
            ''
          ).toLowerCase();

          const matchesRef =
            (reference && itemRef === reference) ||
            (serverId && String(item?.id) === String(serverId)) ||
            (clientRequestId && String(item?.client_request_id) === String(clientRequestId));

          const matchesRecipient = cleanUser && (itemRecipient === cleanUser || itemRecipient.includes(cleanUser));

          return matchesRef || matchesRecipient;
        });

        if (match) {
          const isFinal = Boolean(match?.is_final);
          const rawStatus = String(match?.status || '').toLowerCase();
          const isSuccess =
            match?.is_success === true ||
            rawStatus === 'completed' ||
            rawStatus === 'success' ||
            rawStatus === 'approved' ||
            rawStatus === 'delivered' ||
            rawStatus === 'paid' ||
            (isFinal && !['failed', 'cancelled', 'rejected'].includes(rawStatus));
          const isCancelled = rawStatus === 'cancelled';
          const isFailed = rawStatus === 'failed' || rawStatus === 'declined' || rawStatus === 'rejected';

          if (isSuccess || isCancelled || isFailed || isFinal) {
            return {
              success: true,
              data: match,
              is_final: isFinal || isSuccess || isCancelled || isFailed,
              status: rawStatus || (isSuccess ? 'completed' : 'pending'),
              is_success: isSuccess,
              is_cancelled: isCancelled,
              is_failed: isFailed,
            };
          }
        }
      }
    } catch (listErr) {
      // Continue to wallet check
    }

    // ─── 3. Query Wallet Transactions: GET /wallet/transactions/?type=gift_sent ─
    // When Telebirr processes payment and calls the webhook, FlipStar records a 'gift_sent' transaction.
    try {
      const txRes = await api.request('/wallet/transactions/?type=gift_sent&page_size=10', {
        method: 'GET',
        silent: true,
        skipCache: true,
      });
      const txList = Array.isArray(txRes) ? txRes : txRes?.results || [];
      if (txList.length > 0) {
        const matchTx = txList.find((tx) => {
          if (tx.is_successful === false) return false;

          const txRecipient = String(
            tx?.recipient_username ||
            tx?.other_user?.username ||
            (typeof tx?.recipient === 'object' ? tx?.recipient?.username : tx?.recipient) ||
            ''
          ).toLowerCase();

          const matchesUser = cleanUser && (txRecipient === cleanUser || txRecipient.includes(cleanUser));

          const txTime = new Date(tx.created_at).getTime();
          const isRecent = !isNaN(txTime) ? (txTime >= (initiatedAt - 15000)) : true;

          const matchesRef = reference && tx?.payment_reference && String(tx.payment_reference) === reference;

          return (matchesUser && isRecent) || matchesRef;
        });

        if (matchTx) {
          console.log('🎁 [Confirmed gift delivery via wallet_transactions]:', matchTx);
          return {
            success: true,
            data: matchTx,
            is_final: true,
            status: 'completed',
            is_success: true,
            is_cancelled: false,
            is_failed: false,
          };
        }
      }
    } catch (txErr) {
      // Continue
    }

    // ─── 4. Query Virtual Gifts Sent: GET /gifts/sent/ ───────────────────────
    try {
      const sentRes = await api.request('/gifts/sent/?page_size=5', {
        method: 'GET',
        silent: true,
        skipCache: true,
      });
      const sentList = Array.isArray(sentRes) ? sentRes : sentRes?.results || [];
      if (sentList.length > 0) {
        const matchSent = sentList.find((gt) => {
          const gtRecipient = String(
            gt?.recipient?.username ||
            gt?.recipient_username ||
            (typeof gt?.recipient === 'string' ? gt?.recipient : '') ||
            ''
          ).toLowerCase();
          const gtTime = new Date(gt.created_at).getTime();
          const isRecent = !isNaN(gtTime) ? (gtTime >= (initiatedAt - 15000)) : true;
          return cleanUser && gtRecipient === cleanUser && isRecent;
        });

        if (matchSent) {
          console.log('🎁 [Confirmed gift delivery via /gifts/sent/]:', matchSent);
          return {
            success: true,
            data: matchSent,
            is_final: true,
            status: 'completed',
            is_success: true,
            is_cancelled: false,
            is_failed: false,
          };
        }
      }
    } catch (gtErr) {
      // Continue
    }

    return {
      success: true,
      is_final: false,
      data: { status: 'pending', is_final: false },
      status: 'pending',
      is_success: false,
      is_cancelled: false,
      is_failed: false,
    };
  }

  /**
   * POST /gift-purchases/<reference>/cancel/ - Cancel while pending
   */
  async cancelPayment(reference) {
    if (!reference) return { success: true };

    try {
      const response = await api.request(`/gift-purchases/${encodeURIComponent(reference)}/cancel/`, {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.warn('Cancel payment error:', error?.message);
      return {
        success: false,
        error: error?.message || 'Failed to cancel payment',
        data: { status: 'cancelled', reference },
      };
    }
  }

  /**
   * GET /gift-purchases/ - My gift purchases list
   */
  async getMyGiftPurchases(page = 1, pageSize = 20) {
    try {
      const res = await api.request(`/gift-purchases/?page=${page}&page_size=${pageSize}`);
      return { success: true, data: res };
    } catch (err) {
      console.warn('Error fetching gift purchases:', err?.message);
      return { success: false, error: err?.message, data: [] };
    }
  }

  /**
   * GET /wallet/transactions/?type=gift_sent
   */
  async getGiftSentTransactions(page = 1, pageSize = 50) {
    try {
      const res = await api.request(
        `/wallet/transactions/?type=gift_sent&page=${page}&page_size=${pageSize}`,
        { skipCache: true }
      );
      return { success: true, data: res };
    } catch (err) {
      console.warn('Error fetching gift_sent transactions:', err?.message);
      return { success: false, error: err?.message, data: [] };
    }
  }

  /**
   * GET /wallet/transactions/?type=gift_received
   */
  async getGiftReceivedTransactions(page = 1, pageSize = 50) {
    try {
      const res = await api.request(
        `/wallet/transactions/?type=gift_received&page=${page}&page_size=${pageSize}`,
        { skipCache: true }
      );
      return { success: true, data: res };
    } catch (err) {
      console.warn('Error fetching gift_received transactions:', err?.message);
      return { success: false, error: err?.message, data: [] };
    }
  }
}

export default new TelebirrGiftService();
