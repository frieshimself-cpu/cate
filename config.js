/* ══════════════════════════════════════════════════════════
   /prompt/cate — THE ONLY FILE YOU NEED TO EDIT AT LAUNCH
   ══════════════════════════════════════════════════════════

   1. paste your pump.fun mint into `contract` below
   2. fill in the socials
   3. deploy

   everything else on the site wires itself up from this:
   the contract display + copy button, the live market feed, the
   on-chain verifier, the chart / pump.fun / rugcheck links, the
   raid kit, and the share card.

   while `contract` is empty the site runs in PRE-LAUNCH mode:
   every live panel shows an honest "not launched yet" state
   instead of pretending to have data.
   ────────────────────────────────────────────────────────── */

window.CATE_CONFIG = {
  /* display name + ticker */
  name:   '/prompt/cate',
  ticker: 'CATE',

  /* ── paste the mint address here ──────────────────────
     a pump.fun mint is base58 and usually ends in "pump", e.g.
       '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'
     leave it empty ('') until you have one.                */
  contract: 'Esvpe9ooHXFC58rbV9HEvooMAzJrrYJNNBbecHGZpump',

  /* solana JSON-RPC used by the on-chain verifier (05).
     the free public endpoint is rate-limited — for anything
     with real traffic use helius / quicknode / triton.

     ⚠ IF YOU CHANGE THIS, add the new origin to `connect-src`
       in vercel.json or the browser will block it.          */
  rpc: 'https://api.mainnet-beta.solana.com',

  /* stated supply, used for the pre-launch display only.
     once a contract is set, real supply is read from chain.  */
  supply: 1000000000,

  /* socials — leave a field empty to hide that link */
  socials: {
    x:        'https://x.com/promptcate',
    telegram: '',
    github:   '',
  },
};
