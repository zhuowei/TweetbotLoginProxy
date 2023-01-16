import express from 'express';
import multer from 'multer';
import {webcrypto} from 'node:crypto';
import {TwitterApi} from 'twitter-api-v2';

const subtle = webcrypto.subtle;

const app = express();

const upload = multer();

const appKey = process.env.TWITTER_APP_KEY;
const appSecret = process.env.TWITTER_APP_SECRET;

const twitterClient = new TwitterApi({
  appKey,
  appSecret,
});

let oauthToken = '';
let oauthTokenSecret = '';
let oauthConsumerKeyEncoded = await encodeTweetbot(process.env.TWITTER_APP_KEY);
let oauthConsumerSecretEncoded =
    await encodeTweetbot(process.env.TWITTER_APP_SECRET);

async function encodeTweetbot(inputString) {
  const key = 'account';
  const hashedKey = await subtle.digest('SHA-256', key);
  const importedKey = await subtle.importKey(
      'raw', hashedKey, 'AES-CBC', false, ['encrypt', 'decrypt']);
  // TODO(zhuowei): random IVs?
  const allZeroesIv = new ArrayBuffer(16);
  const encryptedData = await subtle.encrypt(
      {name: 'AES-CBC', iv: allZeroesIv}, importedKey, inputString);
  return Buffer.from(encryptedData).toString('base64');
}

app.post('/tweetbot/5/oauth/request_token', upload.none(), async (req, res) => {
  const oauthCallback = 'tweetbot:///request_token?uuid=' + req.body.uuid;
  const oauthResult = await twitterClient.post(
      'https://api.twitter.com/oauth/request_token',
      {oauth_callback: oauthCallback});
  // TODO(zhuowei): use UUID to handle this
  oauthToken = oauthResult.oauth_token;
  oauthTokenSecret = oauthResult.oauth_token_secret;
  res.json({oauth_token: oauthResult.oauth_token});
});

app.post('/tweetbot/5/oauth/access_token', upload.none(), async (req, res) => {
  const oauthVerifier = req.body.oauth_verifier;
  const newClient = new TwitterApi({
    appKey,
    appSecret,
    accessToken: oauthToken,
    accessSecret: oauthTokenSecret,
  });
  const oauth_result = await newClient.post(
      'https://api.twitter.com/oauth/access_token',
      {oauth_token: oauthToken, oauth_verifier: oauthVerifier});
  res.json({
    oauth_token: await encodeTweetbot(oauth_result.oauth_token),
    oauth_token_secret: await encodeTweetbot(oauth_result.oauth_token_secret),
    oauth_consumer_key_encoded: oauthConsumerKeyEncoded,
    oauth_consumer_secret_encoded: oauthConsumerSecretEncoded,
    user_id: oauth_result.user_id,
    screen_name: oauth_result.screen_name
  });
});

app.listen(process.env.PORT || 3000);
