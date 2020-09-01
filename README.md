# Tourney Bot

1.  Set up a `.env` file like `.env.example`. `TOKEN` should be a Discord bot token. Information on how to do that is [here](https://discordjs.guide/preparations/setting-up-a-bot-application.html#what-is-a-token-anyway).

2.  Follow the instructions [here](https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=service-account) to get Google API credentials. Save this in a file called `google-api-credentials.json` in the root directory.

3.  Install dependencies with

        yarn

4.  Run using

        yarn dev
