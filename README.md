peerbet_dice_bot
================

Automated rolls in peerbet.org's dice game using node.js.

<ul>Customise the code:
<li>add your peerbet username and password in lines 195 and 196.</li>
<li>set the amount of rolls you want to make in one session in line 199.</li>
<li>customise your base bet in BTC (line 197), whether the bot returns to this base on a win or lose (lines 201 and 203), and if not, specify the multiplier for the next bet (lines 202 and 204).</li>
<li>customise your maximum number of bet multiplications (line 206).  The script will only multiply your bet this many times, as a stop loss measure to keep you from losing your entire bankroll.</li>
</ul>

<ul>Run the script in node (available from nodejs.org)
<li>at your command prompt
<pre>> node peerbet_dice_bot.js</pre></li>
</ul>