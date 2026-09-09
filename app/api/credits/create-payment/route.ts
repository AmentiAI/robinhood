import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_TIERS } from '@/lib/credits/constants';
import { sql } from '@/lib/database';
import { checkHolderStatus } from '@/lib/holder-check';
import { getPlatformWalletAddress } from '@/lib/robinhood/platform-wallet';
import { getRobinhoodNetwork } from '@/lib/robinhood/config';

const BTC_PAYMENT_ADDRESS = process.env.FEE_WALLET || 'bc1p693zz6n9cvmsewemg4j0pmvfvs4th3ft9c74afrc90l6sah300uqt99vee';
const ETH_MAINNET_PAYMENT_ADDRESS = process.env.ETH_PAYMENT_ADDRESS || '0x5CA2e4B034d2F37D66C6d546F14a52651726118A';

async function fetchExchangeRate(coinId: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
    const data = await response.json();
    return data[coinId]?.usd || 0;
  } catch (error) {
    console.error(`Error fetching ${coinId} price:`, error);
    return 0;
  }
}

// POST /api/credits/create-payment — default live path is ETH on Robinhood Chain
export async function POST(request: NextRequest) {
  if (!sql) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      wallet_address,
      tier_index,
      fee_rate,
      payment_type = 'eth',
      holder_discount = 0,
      network: requestedNetwork,
    } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    if (tier_index === undefined || tier_index < 0 || tier_index >= CREDIT_TIERS.length) {
      return NextResponse.json({ error: 'Invalid tier index' }, { status: 400 });
    }

    if (!['btc', 'eth', 'sol'].includes(payment_type)) {
      return NextResponse.json({ error: 'Invalid payment type. Must be btc, eth, or sol' }, { status: 400 });
    }

    const tier = CREDIT_TIERS[tier_index];

    let discountMultiplier = 1;
    try {
      const holderData = await checkHolderStatus(wallet_address);
      if (holderData.isHolder && holderData.discountPercent > 0) {
        discountMultiplier = 1 - (holderData.discountPercent / 100);
      } else if (holder_discount > 0) {
        console.warn(
          `[Payment] Client claimed ${holder_discount}% discount but holder check failed for ${wallet_address}`
        );
      }
    } catch (err) {
      console.warn('[Payment] Could not verify holder discount, proceeding without discount:', err);
    }

    const usdAmount = tier.totalPrice * discountMultiplier;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    let paymentAddress: string;
    let cryptoAmount: number;
    let bitcoinAmount: number;
    let network: string;
    let responseData: any = {};

    if (payment_type === 'btc') {
      paymentAddress = BTC_PAYMENT_ADDRESS;
      network = 'bitcoin';
      let btcRate = await fetchExchangeRate('bitcoin');
      if (!btcRate || btcRate <= 0) btcRate = 40000;
      cryptoAmount = usdAmount / btcRate;
      bitcoinAmount = cryptoAmount;
      const bitcoinAmountSats = Math.ceil(cryptoAmount * 100000000);
      const finalFeeRate = fee_rate || 10;
      responseData = {
        bitcoinAmountSats,
        feeRate: finalFeeRate,
        instructions: {
          recipientAddress: paymentAddress,
          amountSats: bitcoinAmountSats,
          feeRate: finalFeeRate,
        },
      };
    } else if (payment_type === 'eth') {
      const rhWallet = getPlatformWalletAddress();
      const useRobinhood = requestedNetwork === 'robinhood' || requestedNetwork === 'rh' || !!rhWallet;
      paymentAddress = useRobinhood && rhWallet ? rhWallet : ETH_MAINNET_PAYMENT_ADDRESS;
      network = useRobinhood && rhWallet ? `robinhood-${getRobinhoodNetwork()}` : 'ethereum';

      let ethRate = await fetchExchangeRate('ethereum');
      if (!ethRate || ethRate <= 0) ethRate = 2500;
      cryptoAmount = usdAmount / ethRate;
      bitcoinAmount = cryptoAmount;
      responseData = { ethAmount: cryptoAmount };
    } else if (payment_type === 'sol') {
      return NextResponse.json(
        { error: 'SOL payments are deprecated. Use ETH on Robinhood Chain.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const result = (await sql`
      INSERT INTO pending_payments (
        wallet_address,
        credits_amount,
        bitcoin_amount,
        payment_address,
        expires_at,
        payment_txid,
        confirmations,
        payment_type,
        network
      )
      VALUES (
        ${wallet_address},
        ${tier.credits},
        ${bitcoinAmount.toFixed(8)},
        ${paymentAddress},
        ${expiresAt.toISOString()},
        NULL,
        0,
        ${payment_type},
        ${network}
      )
      RETURNING id, payment_address, bitcoin_amount, expires_at, created_at, payment_type, network
    `) as any[];

    const payment = Array.isArray(result) && result.length > 0 ? result[0] : null;
    if (!payment) {
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    return NextResponse.json({
      paymentId: payment.id,
      paymentAddress: payment.payment_address,
      bitcoinAmount: payment.bitcoin_amount,
      creditsAmount: tier.credits,
      expiresAt: payment.expires_at,
      paymentType: payment.payment_type,
      network: payment.network,
      ...responseData,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create payment' }, { status: 500 });
  }
}
