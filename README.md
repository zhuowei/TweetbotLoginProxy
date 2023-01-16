Set up [mitmproxy](https://mitmproxy.org)

```
mitmweb --map-remote "@https://push.tapbots.com/@http://localhost:3000/"
```

Edit run.sh.template with Twitter API keys.

Note that the API keys need Elevated Access, and the redirect URL of the API app should be

```
tweetbot:///request_token
```

Run the server:

```
npm install
./run.sh
```

Try to log in; mitmproxy will route Tweetbot's authentication to your server and use your API keys.

TODO:

- Get this to work with xAuth API keys

Thanks:

- [@428rinsuki](https://twitter.com/428rinsuki/status/1614908507249348608) for figuring out the redirect url
- [@KhaosT](https://mastodon.tz.is/@khaost/109698062822139508) for documenting the response format
