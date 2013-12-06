peerbet_dice_bot
================

Automated rolls in peerbet.org's dice game using node.js.

1. Customise the code:
* add your peerbet username and password in lines 171 and 172.
* set the amount of rolls you want to make in one session in line 175.
* customise your base bet in BTC (line 173), whether the bot returns to this base on a win or lose (lines 177 and 179), and if not, specify the multiplier for the next bet (lines 178 and 180).

2. Run the script in node (available from nodejs.org)
* at your command prompt
> node peerbet_dice_bot.js