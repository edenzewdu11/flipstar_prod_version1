import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Easing,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Polygon, Line } from 'react-native-svg';
import TelebirrGiftService from '../../services/TelebirrGiftService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design Theme Tokens
const BRAND_GREEN = '#9dd632'; // Vibrant telebirr lime green from screenshots
const BRAND_GREEN_BADGE = '#b8ea40';
const DARK_BG = '#121412';
const CARD_BG = '#1a1d1a';
const CARD_BG_INNER = '#151715';
const BORDER_COLOR = '#282d28';
const BORDER_LIGHT = '#353a35';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9ca3af';
const TEXT_MUTED = '#6b7280';
const TEXT_AMBER = '#f59e0b';
const TEXT_DARK = '#111811';

// 10 Gifts: Rose to Lion (100 to 10,000 coins) matching screenshots
export const GIFT_ITEMS = [
  {
    id: 1,
    name: 'Rose',
    amharicName: 'ጽጌረዳ',
    description: 'A beautiful red rose for expressing love and admiration.',
    iconType: 'flower',
    price: 100,
    etbPrice: 10.0,
    rarity: 'COMMON',
    color: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.18)',
  },
  {
    id: 2,
    name: 'Heart',
    amharicName: 'ፍቅር',
    description: 'Pure love and appreciation for the creator.',
    iconType: 'heart',
    price: 200,
    etbPrice: 20.0,
    rarity: 'COMMON',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.18)',
  },
  {
    id: 3,
    name: 'Cat',
    amharicName: 'ድመት',
    description: 'Playful and cute cat for cheering up.',
    iconType: 'cat',
    price: 300,
    etbPrice: 30.0,
    rarity: 'COMMON',
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.18)',
  },
  {
    id: 4,
    name: 'Medal',
    amharicName: 'ጀግና',
    description: 'Honor true champion content creators.',
    iconType: 'medal',
    price: 500,
    etbPrice: 50.0,
    rarity: 'RARE',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.18)',
  },
  {
    id: 5,
    name: 'Star',
    amharicName: 'ኮከብ',
    description: 'Shine bright like a star in the community.',
    iconType: 'star',
    price: 1000,
    etbPrice: 100.0,
    rarity: 'RARE',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.18)',
  },
  {
    id: 6,
    name: 'Diamond',
    amharicName: 'አልማዝ',
    description: 'Precious diamond for top-tier creators.',
    iconType: 'diamond',
    price: 1500,
    etbPrice: 150.0,
    rarity: 'EPIC',
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.18)',
  },
  {
    id: 7,
    name: 'Crown',
    amharicName: 'ዘውድ',
    description: 'Royal crown for the king or queen of creators.',
    iconType: 'crown',
    price: 2000,
    etbPrice: 200.0,
    rarity: 'EPIC',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.18)',
  },
  {
    id: 8,
    name: 'Sports Car',
    amharicName: 'V8',
    description: 'High performance V8 sports car luxury gift.',
    iconType: 'car',
    price: 3000,
    etbPrice: 300.0,
    rarity: 'LEGENDARY',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.18)',
  },
  {
    id: 9,
    name: 'Rocket',
    amharicName: 'ሮኬት',
    description: 'To the moon! Ultimate hype booster gift.',
    iconType: 'rocket',
    price: 5000,
    etbPrice: 500.0,
    rarity: 'LEGENDARY',
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.18)',
  },
  {
    id: 10,
    name: 'Lion',
    amharicName: 'አንበሳ',
    description: 'The King of the jungle! Supreme legendary gift.',
    iconType: 'lion',
    price: 10000,
    etbPrice: 1000.0,
    rarity: 'LEGENDARY',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.22)',
  },
];

const RARITY_COLORS = {
  COMMON: '#94a3b8',
  RARE: '#38bdf8',
  EPIC: '#c084fc',
  LEGENDARY: '#fb923c',
};

const MULTIPLIERS = [1, 2, 5, 10, 20];

// Clean vector SVG icons matching screenshots
function GiftVectorIcon({ type, size = 22, color = '#FFFFFF' }) {
  switch (type) {
    case 'flower':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="10" r="3" />
          <Path d="M12 7c0-2.5-2-4-4.5-4S3 5 3 7.5c0 2.5 2 4.5 4.5 4.5" />
          <Path d="M12 7c0-2.5 2-4 4.5-4s4.5 2 4.5 4.5c0 2.5-2 4.5-4.5 4.5" />
          <Path d="M9 13.5c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5c2 0 3-1.5 3-3.5" />
          <Path d="M15 13.5c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5c-2 0-3-1.5-3-3.5" />
          <Path d="M12 13v9" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Svg>
      );
    case 'cat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 10a8 8 0 1 0 16 0c0-3-1-5-2-7l-3 2c-1.5-.5-3-.5-4.5 0l-3-2c-1 2-2 4-2 7" />
          <Circle cx="9" cy="11.5" r="1.2" fill={color} />
          <Circle cx="15" cy="11.5" r="1.2" fill={color} />
          <Path d="M11 14.5h2" />
        </Svg>
      );
    case 'medal':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="15" r="5" />
          <Path d="M8.5 3h7l-1.5 8h-4z" />
          <Path d="M9 3l3 8 3-8" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </Svg>
      );
    case 'diamond':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="12" y="3" width="11" height="11" rx="2" transform="rotate(45 12 3)" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 19h16v1.5H4z" fill={color} opacity="0.3" />
          <Path d="M4 18L3 7l5 4 4-6 4 6 5-4-1 11H4z" />
          <Line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" />
        </Svg>
      );
    case 'car':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 15h14a2 2 0 0 0 2-2l-1-4a3 3 0 0 0-3-2H7a3 3 0 0 0-3 2l-1 4a2 2 0 0 0 2 2z" />
          <Circle cx="7.5" cy="15.5" r="2" />
          <Circle cx="16.5" cy="15.5" r="2" />
          <Path d="M7 9l1.5-2.5h7L17 9" />
        </Svg>
      );
    case 'rocket':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 4.5l4.5 4.5" />
          <Path d="M19 5a7 7 0 0 0-7-2 9 9 0 0 0-6 6c0 1.5.5 3 1.5 4L5 18l1 1 5-2.5c1 1 2.5 1.5 4 1.5a9 9 0 0 0 6-6 7 7 0 0 0-2-7z" />
          <Circle cx="14" cy="10" r="1.5" fill={color} />
        </Svg>
      );
    case 'lion':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="5" />
          <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M5.6 18.4l1.5-1.5M16.9 7.1l1.5-1.5" />
          <Circle cx="10" cy="11.5" r="0.9" fill={color} />
          <Circle cx="14" cy="11.5" r="0.9" fill={color} />
          <Path d="M11 14.2c.5.4 1.5.4 2 0" />
        </Svg>
      );
    default:
      return <Ionicons name="gift" size={size} color={color} />;
  }
}

// Interlocking coins vector icon matching screenshot
function CoinIcon({ size = 11, color = '#f59e0b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="12" r="7" stroke={color} strokeWidth="2.2" />
      <Circle cx="15" cy="12" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M9 9.5v5M15 9.5v5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export default function TelebirrGiftModal({
  visible,
  onClose,
  recipientUsername = 'Mr. No.1',
  reelId = null,
  onGiftSent,
}) {
  const [step, setStep] = useState('choose'); // 'choose' | 'waiting' | 'cancelled' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [giftList, setGiftList] = useState(GIFT_ITEMS);
  const [selectedGift, setSelectedGift] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [quoteData, setQuoteData] = useState(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentSteps, setPaymentSteps] = useState({
    requested: false,
    approving: false,
    delivered: false,
  });

  const pollTimerRef = useRef(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.6)).current;

  // Reset state and fetch gifts from /gifts/ when modal opens
  useEffect(() => {
    if (visible) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setSelectedGift(null);
      setQuantity(1);
      setMessage('');
      setErrorMessage('');
      setIsSubmitting(false);
      setPaymentUrl(null);
      setQuoteData(null);
      setStep('choose');

      // 1. Fetch live gifts from GET /gifts/
      TelebirrGiftService.getGifts()
        .then((serverGifts) => {
          if (Array.isArray(serverGifts) && serverGifts.length > 0) {
            const merged = serverGifts.map((sg, index) => {
              const localMatch =
                GIFT_ITEMS.find(
                  (g) =>
                    g.id === sg.id ||
                    (g.name && sg.name && g.name.toLowerCase() === sg.name.toLowerCase())
                ) || GIFT_ITEMS[index % GIFT_ITEMS.length];

              const coinVal = sg.coin_value || sg.coins || sg.price || localMatch.price;
              const etbVal = sg.price_etb || sg.amount_etb || coinVal / 10;

              return {
                ...localMatch,
                ...sg,
                id: sg.id || localMatch.id,
                name: sg.name || localMatch.name,
                amharicName: sg.amharic_name || localMatch.amharicName,
                description: sg.description || localMatch.description,
                price: coinVal,
                etbPrice: parseFloat(etbVal) || localMatch.etbPrice,
                iconType: localMatch.iconType || 'flower',
                color: sg.icon_color || localMatch.color,
                rarity: (sg.rarity || localMatch.rarity || 'COMMON').toUpperCase(),
              };
            });
            setGiftList(merged);
          }
        })
        .catch((e) => console.warn('Could not load /gifts/:', e));

      // 2. Fetch user phone for telebirr USSD Push
      TelebirrGiftService.getUserPhone().then((p) => {
        if (p) setPayerPhone(p);
      });
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [visible]);

  // Fetch real-time price/fee quote via POST /gift-purchases/quote/
  useEffect(() => {
    if (!selectedGift || !visible) return;
    let isMounted = true;
    setIsQuoting(true);

    TelebirrGiftService.getQuote(
      selectedGift.id,
      quantity,
      recipientUsername,
      reelId
    )
      .then((res) => {
        if (isMounted) {
          setIsQuoting(false);
          if (res?.success && res?.data) {
            setQuoteData(res.data);
          }
        }
      })
      .catch(() => {
        if (isMounted) setIsQuoting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGift?.id, quantity, recipientUsername, reelId, visible]);

  // Handle pulse & spin animations in waiting state
  useEffect(() => {
    if (step === 'waiting') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();

      return () => {
        pulseLoop.stop();
        spinLoop.stop();
      };
    }
  }, [step]);

  // Handle celebratory success entrance animation
  useEffect(() => {
    if (step === 'success') {
      successScaleAnim.setValue(0.5);
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  // Calculations for chosen gift incorporating quote data when available
  const unitCoins = selectedGift?.price || 0;
  const totalCoins = quoteData?.coins || quoteData?.total_coins || unitCoins * quantity;
  const unitEtb = selectedGift?.etbPrice || 0;
  const rawTotalEtb =
    quoteData?.total_etb != null
      ? parseFloat(quoteData.total_etb)
      : quoteData?.amount_etb != null
      ? parseFloat(quoteData.amount_etb)
      : unitEtb * quantity;
  const totalEtb = rawTotalEtb.toFixed(2);
  const feeEtb = (
    quoteData?.fee_etb != null
      ? parseFloat(quoteData.fee_etb)
      : rawTotalEtb * 0.20
  ).toFixed(2);
  const creatorPoints = quoteData?.creator_points || Math.round(totalCoins * 0.80);

  const handleSelectGift = (item) => {
    if (selectedGift?.id === item.id) {
      setSelectedGift(item);
    } else {
      setSelectedGift(item);
      setQuantity(1);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedGift || isSubmitting) return;

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const ref = TelebirrGiftService.generateReference();
    setTransactionRef(ref);
    setErrorMessage('');
    setIsSubmitting(true);
    setPaymentSteps({ requested: true, approving: false, delivered: false });
    setStep('waiting');

    try {
      const response = await TelebirrGiftService.initiateGiftPayment(
        selectedGift.id,
        recipientUsername,
        totalEtb,
        ref,
        quantity,
        message,
        reelId,
        payerPhone,
        'telebirr_ussd'
      );

      setIsSubmitting(false);

      if (!response.success) {
        setErrorMessage(response.error || 'Failed to send gift. Please check your balance and try again.');
        setStep('error');
        return;
      }

      // Check if backend returned a payment URL (Telebirr H5 or web gateway)
      const payUrl =
        response?.payment_url ||
        response?.telebirr_url ||
        response?.data?.to_pay_url ||
        response?.data?.to_pay ||
        response?.data?.payment_url ||
        response?.data?.telebirr_url ||
        response?.data?.url;

      if (payUrl) {
        setPaymentUrl(payUrl);
        Linking.openURL(payUrl).catch((e) => console.warn('Could not open payment URL:', e));
      }

      // Extract real server purchase reference or ID
      const purchaseId =
        response?.purchase_id ||
        response?.reference ||
        response?.data?.reference ||
        response?.data?.id ||
        ref;

      setTransactionRef(String(purchaseId));

      setPaymentSteps({ requested: true, approving: true, delivered: false });

      const paymentIdentifiers = {
        reference: String(purchaseId),
        purchase_id: String(purchaseId),
        server_id: response?.server_id || response?.data?.id || null,
        client_request_id: response?.client_request_id || null,
        initiated_at: response?.initiated_at || Date.now(),
      };

      // Poll GET /gift-purchases/<reference>/, list & wallet_transactions until "is_final": true
      let attempts = 0;
      pollTimerRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await TelebirrGiftService.checkPaymentStatus(
            paymentIdentifiers,
            selectedGift.id,
            recipientUsername
          );

          const isFinal = Boolean(statusRes?.is_final);
          const isSuccess = Boolean(statusRes?.is_success);
          const isCancelled = Boolean(statusRes?.is_cancelled);
          const isFailed = Boolean(statusRes?.is_failed);

          // Stop polling as soon as transaction reaches final state
          if (isFinal) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }

            if (isSuccess) {
              setPaymentSteps({ requested: true, approving: true, delivered: true });
              setTimeout(() => {
                setStep('success');
                if (onGiftSent) {
                  onGiftSent({
                    gift: selectedGift,
                    recipient: recipientUsername,
                    amountEtb: totalEtb,
                    points: creatorPoints,
                    quantity: quantity,
                    message: message,
                    reference: String(purchaseId),
                    reelId: reelId,
                  });
                }
              }, 500);
            } else if (isCancelled) {
              setStep('cancelled');
            } else {
              setErrorMessage(
                statusRes?.data?.error ||
                statusRes?.data?.message ||
                'Payment was declined or cancelled on telebirr.'
              );
              setStep('error');
            }
          } else if (isSuccess) {
            // Also accept success if flag is explicitly marked
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setPaymentSteps({ requested: true, approving: true, delivered: true });
            setTimeout(() => {
              setStep('success');
              if (onGiftSent) {
                onGiftSent({
                  gift: selectedGift,
                  recipient: recipientUsername,
                  amountEtb: totalEtb,
                  points: creatorPoints,
                  quantity: quantity,
                  message: message,
                  reference: String(purchaseId),
                  reelId: reelId,
                });
              }
            }, 500);
          } else if (isCancelled) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setStep('cancelled');
          } else if (isFailed) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setErrorMessage('Payment was declined or cancelled on telebirr.');
            setStep('error');
          } else if (attempts >= 25) {
            // Polling timed out (~65 seconds)
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setErrorMessage('Payment confirmation timed out. If you entered your PIN, the gift will be delivered shortly.');
            setStep('error');
          }
        } catch (pollErr) {
          console.warn('Poll error caught gracefully:', pollErr?.message);
        }
      }, 2500);
    } catch (err) {
      console.error('Gift payment exception:', err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Network error while contacting server. Please try again.');
      setStep('error');
    }
  };

  const handleCancelPayment = async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (transactionRef) {
      await TelebirrGiftService.cancelPayment(transactionRef);
    }
    setStep('cancelled');
  };

  const handleTryAgain = async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    // If user's money was deducted, verify whether the webhook already confirmed the gift
    if (transactionRef) {
      try {
        const verifyRes = await TelebirrGiftService.checkPaymentStatus(
          { reference: transactionRef, initiated_at: Date.now() - 300000 },
          selectedGift?.id,
          recipientUsername
        );
        if (verifyRes?.is_success) {
          setPaymentSteps({ requested: true, approving: true, delivered: true });
          setStep('success');
          if (onGiftSent) {
            onGiftSent({
              gift: selectedGift,
              recipient: recipientUsername,
              amountEtb: totalEtb,
              points: creatorPoints,
              quantity: quantity,
              message: message,
              reference: String(transactionRef),
              reelId: reelId,
            });
          }
          return;
        }
      } catch (_) {}
    }
    setErrorMessage('');
    setStep('choose');
  };

  const handleClose = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setErrorMessage('');
    setStep('choose');
    setSelectedGift(null);
    setQuantity(1);
    setMessage('');
    onClose();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate compact card width so 5 cards fit across screen width without scrolling
  const cardGap = 5;
  const paddingH = 12;
  const cardWidth = Math.floor((SCREEN_WIDTH - (paddingH * 2) - (4 * cardGap)) / 5);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheetContainer, (step === 'waiting' || step === 'cancelled' || step === 'error') && styles.sheetContainerMinimized]}>
          {/* Top drag handle indicator */}
          <View style={styles.dragHandle} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.giftIconBadge}>
                <Ionicons name="gift" size={24} color={TEXT_DARK} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Send a gift</Text>
                <Text style={styles.headerSubtitle}>
                  to <Text style={styles.headerRecipient}>@{recipientUsername}</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          {/* Security / Telebirr Banner - only for gift selection step */}
          {step === 'choose' && (
            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark-outline" size={15} color={BRAND_GREEN} />
              <Text style={styles.infoBannerText}>
                Paid securely with <Text style={styles.boldWhite}>telebirr</Text> · gifts from{' '}
                <Text style={styles.boldWhite}>100</Text> to{' '}
                <Text style={styles.boldWhite}>10,000</Text> coins
              </Text>
            </View>
          )}

          {/* ==================================================================== */}
          {/* MAIN GIFT SCREEN: COMPACT 5x2 GRID + DYNAMIC "HOW MANY" BOX          */}
          {/* ==================================================================== */}
          {step === 'choose' && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.mainScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Section Header */}
              <Text style={styles.sectionTitle}>CHOOSE A GIFT</Text>

              {/* Compact 5-column x 2-row Grid (All gifts visible with NO scrolling!) */}
              <View style={styles.compactGridWrap}>
                {giftList.map((item) => {
                  const isSelected = selectedGift?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.compactCard,
                        { width: cardWidth },
                        isSelected && styles.compactCardSelected,
                      ]}
                      onPress={() => handleSelectGift(item)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <View style={styles.compactCheckBadge}>
                          <Ionicons name="checkmark" size={10} color={TEXT_DARK} />
                        </View>
                      )}

                      {/* Icon circle */}
                      <View style={[styles.compactIconCircle, { backgroundColor: item.glowColor }]}>
                        <GiftVectorIcon type={item.iconType} size={18} color={item.color} />
                      </View>

                      {/* Amharic name */}
                      <Text style={styles.compactAmharicText} numberOfLines={1}>
                        {item.amharicName}
                      </Text>

                      {/* English name */}
                      <Text style={styles.compactEnglishText} numberOfLines={1}>
                        {item.name}
                      </Text>

                      {/* Coin price */}
                      <View style={styles.compactPriceRow}>
                        <CoinIcon size={9} color={TEXT_AMBER} />
                        <Text style={styles.compactPriceText}>
                          {item.price >= 1000 ? `${(item.price / 1000).toFixed(item.price % 1000 === 0 ? 0 : 1)}k` : item.price}
                        </Text>
                      </View>

                      {/* Rarity label */}
                      <View style={styles.compactRarityBadge}>
                        <Text style={[styles.compactRarityText, { color: RARITY_COLORS[item.rarity] }]}>
                          {item.rarity}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ================================================================== */}
              {/* WHEN A GIFT IS CHOSEN: SHOW BOX THAT SHOWS HOW MANY OF IT          */}
              {/* ================================================================== */}
              {selectedGift ? (
                <View style={styles.quantityBoxSection}>
                  {/* Selected Gift Summary Card with Stepper [- 1 +] */}
                  <View style={styles.detailGiftCard}>
                    <View style={[styles.detailIconBox, { backgroundColor: selectedGift.glowColor }]}>
                      <GiftVectorIcon type={selectedGift.iconType} size={26} color={selectedGift.color} />
                    </View>

                    <View style={styles.detailCardInfo}>
                      <Text style={styles.detailTitleText}>
                        {selectedGift.amharicName} - {selectedGift.name}
                      </Text>
                      <Text style={styles.detailDescText} numberOfLines={1}>
                        {selectedGift.description}
                      </Text>
                    </View>

                    {/* Stepper [- 1 +] */}
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                        onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
                        disabled={quantity <= 1}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={15} color={quantity <= 1 ? TEXT_MUTED : TEXT_SECONDARY} />
                      </TouchableOpacity>

                      <Text style={styles.stepperValueText}>{quantity}</Text>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setQuantity(prev => Math.min(99, prev + 1))}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={15} color={TEXT_PRIMARY} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Multipliers row: [x1] x2 x5 x10 x20 */}
                  <View style={styles.multiplierRow}>
                    {MULTIPLIERS.map(m => {
                      const isSelected = quantity === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.multiplierChip, isSelected && styles.multiplierChipActive]}
                          onPress={() => setQuantity(m)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.multiplierChipText, isSelected && styles.multiplierChipTextActive]}>
                            x{m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Summary Card: Gift value & Amount in Birr */}
                  <View style={styles.breakdownCard}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.giftValueLabel}>Gift value</Text>
                      <View style={styles.giftValueCoins}>
                        <CoinIcon size={14} color={TEXT_AMBER} />
                        <Text style={styles.giftValueCoinsText}>
                          {totalCoins.toLocaleString()} coins
                        </Text>
                      </View>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownMainLabel}>Amount</Text>
                      <Text style={styles.breakdownMainAmount}>
                        {totalEtb} <Text style={styles.breakdownUnit}>ETB</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Message Input (Optional) */}
                  <View style={styles.messageBox}>
                    <Ionicons name="chatbubble-outline" size={17} color={TEXT_SECONDARY} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Add a message (optional)"
                      placeholderTextColor={TEXT_MUTED}
                      value={message}
                      onChangeText={setMessage}
                      maxLength={150}
                    />
                    <Text style={styles.counterText}>{message.length}/150</Text>
                  </View>

                  {/* Payer Phone Number Input */}
                  <View style={styles.phoneInputCard}>
                    <View style={styles.phoneInputLabelRow}>
                      <Ionicons name="call-outline" size={13} color={BRAND_GREEN} />
                      <Text style={styles.phoneInputLabel}>Payer phone number (telebirr)</Text>
                    </View>
                    <View style={styles.phoneInputRow}>
                      <Text style={styles.phonePrefixText}>+251</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="9XXXXXXXX or 7XXXXXXXX"
                        placeholderTextColor={TEXT_MUTED}
                        keyboardType="phone-pad"
                        value={
                          payerPhone.startsWith('251')
                            ? payerPhone.slice(3)
                            : payerPhone.startsWith('0')
                            ? payerPhone.slice(1)
                            : payerPhone
                        }
                        onChangeText={(val) => {
                          const digits = val.replace(/\D/g, '');
                          setPayerPhone(digits ? `251${digits}` : '');
                        }}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {/* Active Pay with telebirr button */}
                  <View style={{ marginTop: 14, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={styles.mainPayButton}
                      onPress={handleProceedToPayment}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="lock-closed" size={17} color={TEXT_DARK} />
                      <Text style={styles.mainPayButtonText}>
                        Pay {totalEtb} ETB with telebirr
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.footnoteRow}>
                      <Ionicons name="phone-portrait-outline" size={12} color={TEXT_SECONDARY} />
                      <Text style={styles.footnoteText}>
                        You will approve the payment on your phone with your telebirr PIN.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* When nothing is chosen yet: Show "Choose a gift" prompt button */
                <View style={styles.noGiftSelectedWrap}>
                  <TouchableOpacity
                    style={styles.chooseGiftDisabledButton}
                    disabled={true}
                  >
                    <Text style={styles.chooseGiftDisabledText}>Choose a gift</Text>
                  </TouchableOpacity>

                  <View style={styles.footnoteRow}>
                    <Ionicons name="phone-portrait-outline" size={12} color={TEXT_SECONDARY} />
                    <Text style={styles.footnoteText}>
                      You will approve the payment on your phone with your telebirr PIN.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* ==================================================================== */}
          {/* STEP 3: WAITING FOR TELEBIRR (Image 3) - NON-SCROLLABLE & MINIMIZED  */}
          {/* ==================================================================== */}
          {step === 'waiting' && (
            <View style={styles.waitingContainer}>
              {/* Concentric Pulse Rings with Phone Icon */}
              <View style={styles.pulseContainer}>
                <Animated.View
                  style={[
                    styles.outerPulseRing,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <View style={styles.middlePulseRing} />
                <View style={styles.innerPhoneCircle}>
                  <Ionicons name="phone-portrait" size={24} color={TEXT_DARK} />
                </View>
              </View>

              <Text style={styles.waitingTitle}>Waiting for telebirr</Text>
              <Text style={styles.waitingSubtitle}>
                {paymentUrl ? (
                  <>Complete the payment on the Telebirr portal and return here.</>
                ) : (
                  <>Check your phone{payerPhone ? ` (${payerPhone})` : ''} and approve{' '}
                  <Text style={{ color: BRAND_GREEN, fontWeight: '700' }}>{totalEtb} ETB</Text>{' '}
                  with your telebirr PIN.</>
                )}
              </Text>

              {/* 3-Step Progress Card */}
              <View style={styles.stepsCard}>
                {/* Step 1 */}
                <View style={styles.stepItemRow}>
                  <View style={[styles.stepCircle, styles.stepCircleDone]}>
                    <Ionicons name="checkmark" size={11} color={TEXT_DARK} />
                  </View>
                  <Text style={styles.stepTitleDone}>Payment requested</Text>
                </View>

                {/* Step 2 */}
                <View style={styles.stepItemRow}>
                  {paymentSteps.approving ? (
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="refresh" size={15} color={BRAND_GREEN} />
                    </Animated.View>
                  ) : (
                    <View style={styles.stepCirclePending}>
                      <Text style={styles.stepNumText}>2</Text>
                    </View>
                  )}
                  <Text style={[styles.stepTitlePending, paymentSteps.approving && styles.stepTitleActive]}>
                    {paymentUrl ? 'Pay in Telebirr portal' : 'Approve with your telebirr PIN'}
                  </Text>
                </View>

                {/* Step 3 */}
                <View style={styles.stepItemRow}>
                  {paymentSteps.delivered ? (
                    <View style={[styles.stepCircle, styles.stepCircleDone]}>
                      <Ionicons name="checkmark" size={11} color={TEXT_DARK} />
                    </View>
                  ) : (
                    <View style={styles.stepCirclePending}>
                      <Text style={styles.stepNumText}>3</Text>
                    </View>
                  )}
                  <Text style={[styles.stepTitlePending, paymentSteps.delivered && styles.stepTitleDone]}>
                    Gift delivered
                  </Text>
                </View>
              </View>

              {/* Open Portal Button if URL is available */}
              {paymentUrl ? (
                <TouchableOpacity
                  style={styles.openPortalBtn}
                  onPress={() => Linking.openURL(paymentUrl).catch((e) => console.warn(e))}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={17} color={TEXT_DARK} />
                  <Text style={styles.openPortalBtnText}>Open Telebirr Payment Portal</Text>
                </TouchableOpacity>
              ) : null}

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelPaymentBtn}
                onPress={handleCancelPayment}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelPaymentText}>Cancel payment</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 4: PAYMENT CANCELLED (Image 4) - NON-SCROLLABLE & MINIMIZED    */}
          {/* ==================================================================== */}
          {step === 'cancelled' && (
            <View style={styles.cancelledContainer}>
              <View style={styles.cancelledIconRing}>
                <Ionicons name="refresh" size={28} color="#f59e0b" />
              </View>

              <Text style={styles.cancelledTitle}>Payment cancelled</Text>
              <Text style={styles.cancelledSubtitle}>
                The payment was cancelled, so nothing was charged.
              </Text>
              <Text style={styles.referenceText}>Reference: {transactionRef || 'GFT560AF2B7C7C5F1AAE0B3D960'}</Text>

              <View style={styles.dualActionRow}>
                <TouchableOpacity
                  style={styles.tryAgainBtn}
                  onPress={handleTryAgain}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh" size={15} color={TEXT_DARK} />
                  <Text style={styles.tryAgainBtnText}>Try again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeDarkBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeDarkBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP: PAYMENT ERROR (Shows real error without fake success popup)   */}
          {/* ==================================================================== */}
          {step === 'error' && (
            <View style={styles.cancelledContainer}>
              <View style={[styles.cancelledIconRing, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.14)' }]}>
                <Ionicons name="alert-circle" size={30} color="#ef4444" />
              </View>

              <Text style={styles.cancelledTitle}>Payment Failed</Text>
              <Text style={styles.cancelledSubtitle}>
                {errorMessage || 'Unable to complete gift payment. Please check your balance and try again.'}
              </Text>
              {transactionRef ? (
                <Text style={styles.referenceText}>Reference: {transactionRef}</Text>
              ) : null}

              <View style={styles.dualActionRow}>
                <TouchableOpacity
                  style={[styles.tryAgainBtn, { backgroundColor: BRAND_GREEN }]}
                  onPress={handleTryAgain}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh" size={15} color={TEXT_DARK} />
                  <Text style={styles.tryAgainBtnText}>Try again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeDarkBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeDarkBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================================================================== */}
          {/* STEP 5: SUCCESS POP-UP MODAL (Celebratory Gift Sent)                 */}
          {/* ==================================================================== */}
          {step === 'success' && selectedGift && (
            <Animated.View
              style={[
                styles.successContainer,
                { transform: [{ scale: successScaleAnim }] },
              ]}
            >
              {/* Glowing Celebration Halo */}
              <View style={styles.successHalo}>
                <View style={styles.successInnerCircle}>
                  <Ionicons name="checkmark" size={44} color={TEXT_DARK} />
                </View>
              </View>

              <Text style={styles.successTitle}>You Sent Successfully! 🎉</Text>
              <Text style={styles.successSubtitle}>
                Your <Text style={{ color: '#fff', fontWeight: '700' }}>{selectedGift.amharicName} ({selectedGift.name})</Text> gift has been delivered to{' '}
                <Text style={{ color: BRAND_GREEN, fontWeight: '700' }}>@{recipientUsername}</Text>
              </Text>

              {/* Delivery Receipt Card */}
              <View style={styles.deliveryCard}>
                <View style={styles.deliveryHeaderRow}>
                  <View style={[styles.detailIconBox, { width: 40, height: 40, backgroundColor: selectedGift.glowColor }]}>
                    <GiftVectorIcon type={selectedGift.iconType} size={22} color={selectedGift.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                      {selectedGift.amharicName} - {selectedGift.name} {quantity > 1 ? `× ${quantity}` : ''}
                    </Text>
                    <Text style={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                      {totalEtb} ETB paid via telebirr
                    </Text>
                  </View>
                  <View style={styles.giftValueCoins}>
                    <CoinIcon size={14} color={TEXT_AMBER} />
                    <Text style={styles.giftValueCoinsText}>{totalCoins.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.successPointsRow}>
                  <Ionicons name="sparkles" size={17} color={BRAND_GREEN} />
                  <Text style={styles.successPointsText}>
                    Gift delivered to <Text style={{ color: BRAND_GREEN, fontWeight: '800' }}>@{recipientUsername}</Text>
                  </Text>
                </View>

                <View style={styles.successScoreRow}>
                  <Ionicons name="trophy-outline" size={16} color="#f59e0b" />
                  <Text style={styles.successScoreText}>
                    Added <Text style={{ color: '#fff', fontWeight: '700' }}>+10 score</Text> to creator's competition rank
                  </Text>
                </View>

                {message ? (
                  <View style={styles.successMessageRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color={TEXT_SECONDARY} />
                    <Text style={styles.successMessageText} numberOfLines={2}>
                      "{message}"
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.deliveryRefText}>
                  Reference: {transactionRef}
                </Text>
              </View>

              {/* Success Action Buttons */}
              <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
                <TouchableOpacity
                  style={styles.mainPayButton}
                  onPress={() => {
                    setStep('choose');
                    setSelectedGift(null);
                    setQuantity(1);
                    setMessage('');
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="gift-outline" size={18} color={TEXT_DARK} />
                  <Text style={styles.mainPayButtonText}>Send another gift</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeDarkBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeDarkBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: DARK_BG,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    maxHeight: '94%',
    minHeight: 520,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  sheetContainerMinimized: {
    minHeight: 0,
  },
  dragHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#353a35',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  giftIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: BRAND_GREEN_BADGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },
  headerRecipient: {
    color: BRAND_GREEN,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f221f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#142216',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#223b24',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: TEXT_SECONDARY,
    lineHeight: 15,
  },
  boldWhite: {
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  mainScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_GREEN,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 8,
    letterSpacing: 1.1,
  },

  // Compact 5x2 grid styles (Zero scrolling required!)
  compactGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 5,
    marginBottom: 12,
  },
  compactCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    position: 'relative',
  },
  compactCardSelected: {
    borderColor: BRAND_GREEN,
    backgroundColor: 'rgba(157, 214, 50, 0.08)',
  },
  compactCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  compactIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  compactAmharicText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  compactEnglishText: {
    fontSize: 9,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 0.5,
    marginBottom: 2,
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  compactPriceText: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_AMBER,
  },
  compactRarityBadge: {
    backgroundColor: '#141614',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  compactRarityText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // "How many of it" Box Section
  quantityBoxSection: {
    marginTop: 4,
  },
  detailGiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  detailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCardInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  detailTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  detailDescText: {
    fontSize: 11.5,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG_INNER,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#252925',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperValueText: {
    width: 26,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  multiplierChip: {
    flex: 1,
    marginHorizontal: 2.5,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
  },
  multiplierChipActive: {
    borderColor: BRAND_GREEN,
    backgroundColor: 'rgba(157, 214, 50, 0.14)',
  },
  multiplierChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db',
  },
  multiplierChipTextActive: {
    color: BRAND_GREEN,
    fontWeight: '700',
  },
  giftValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  giftValueLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  giftValueCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftValueCoinsText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_AMBER,
  },
  breakdownCard: {
    backgroundColor: CARD_BG_INNER,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownMainLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  breakdownMainAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  breakdownUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  breakdownSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  breakdownSubLabel: {
    fontSize: 12.5,
    color: TEXT_SECONDARY,
  },
  breakdownSubValue: {
    fontSize: 12.5,
    color: '#d1d5db',
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 10,
  },
  breakdownCreatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorReceivesLabel: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  creatorPointsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 13,
    padding: 0,
  },
  counterText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },

  // Bottom action buttons
  mainPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_GREEN,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  mainPayButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footnoteText: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  noGiftSelectedWrap: {
    marginTop: 14,
    marginBottom: 8,
  },
  chooseGiftDisabledButton: {
    backgroundColor: '#1c1f1c',
    borderWidth: 1,
    borderColor: '#282d28',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseGiftDisabledText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6b7280',
  },

  // Minimized Waiting View Styles (Strictly non-scrollable)
  waitingContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },
  pulseContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  outerPulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(157, 214, 50, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(157, 214, 50, 0.22)',
  },
  middlePulseRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(157, 214, 50, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(157, 214, 50, 0.35)',
  },
  innerPhoneCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  waitingSubtitle: {
    fontSize: 12.5,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 9,
    marginBottom: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: BRAND_GREEN,
  },
  stepCirclePending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#282d28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  stepTitleDone: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  stepTitleActive: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  stepTitlePending: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  cancelPaymentBtn: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPaymentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#e5e7eb',
  },

  // Minimized Cancelled View Styles (Strictly non-scrollable)
  cancelledContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  cancelledIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  cancelledSubtitle: {
    fontSize: 12.5,
    color: '#86efac',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  referenceText: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  tryAgainBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_GREEN,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tryAgainBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  closeDarkBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDarkBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  // Success View Styles
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  successHalo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(157, 214, 50, 0.14)',
    borderWidth: 2,
    borderColor: 'rgba(157, 214, 50, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  successInnerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13.5,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  deliveryCard: {
    width: '100%',
    backgroundColor: CARD_BG_INNER,
    borderWidth: 1,
    borderColor: 'rgba(157, 214, 50, 0.35)',
    borderRadius: 16,
    padding: 16,
  },
  deliveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  successPointsText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  successScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  successScoreText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  successMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARD_BG,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  successMessageText: {
    fontSize: 12,
    color: '#d1d5db',
    fontStyle: 'italic',
    flex: 1,
  },
  deliveryRefText: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 8,
    textAlign: 'right',
  },
  paymentMethodWrap: {
    marginTop: 12,
    marginBottom: 4,
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  paymentMethodTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: CARD_BG_INNER,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingVertical: 10,
  },
  paymentMethodTabActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  paymentMethodTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  paymentMethodTabTextActive: {
    color: TEXT_DARK,
    fontWeight: '700',
  },
  phoneInputCard: {
    marginTop: 10,
    backgroundColor: CARD_BG_INNER,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    borderRadius: 12,
    padding: 10,
  },
  phoneInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  phoneInputLabel: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0f0d',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_GREEN,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRIMARY,
    padding: 0,
  },
  openPortalBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    marginBottom: 6,
  },
  openPortalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
});
