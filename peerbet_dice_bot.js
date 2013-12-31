// written by zx81 with love !

// access peerbet api with callback
var get = function(path, callback){

    var isJsonString = function(s){
        return typeof(JSON.parse(s)) == 'object';
    }

    var buffer = '';
    if(typeof(require) != "undefined"){
        var h_get = require('https').get(
            {hostname:'peerbet.org', path:path},
            function(response){

                response.on('data', function(d){
                    buffer += d;
                });

                response.on('end', function(){
                    var data;
                    
                    if(isJsonString(buffer)){
                        data = JSON.parse(buffer);
                    } else {                    
                        data = buffer;
                    }

                    if(typeof(data) != 'object'){   // error msg
                        var msg = "Received unexpected data";
                        throw new Error(msg);

                    }
                                                                        
                    callback(data);
                });
            }            
        );
        h_get.end();
        h_get.on('error', function(e){console.log('Https ' + e);});
    } else {
        var msg = "This is a node.js script. To use it, type > node bot.js at the command prompt";
        throw new Error(msg);
    }
}

var requestKey = function(user, pwd){
    console.log("Signing in to peerbet as " + user);
    var path = "/api/account/?action=signin&user=" + user + "&pass=" + pwd;
    get(path, function(e){
        if(e.hasOwnProperty('key')){
            key = e.key;
        } else {
            var msg = e.hasOwnProperty('message') ? e.message : "Error requesting a key"; 
            throw new Error(msg);
        }
        console.log("Login successful with key " + key);
        requestSeed();
    });
}

var requestSeed = function(){
    var path = "/api/dice/?action=getseed&key=" + key;    
    console.log("Requesting the initial seed to start rolling");
    get(path, function(e){
        if(e.hasOwnProperty('client_seed')){
             start(e.client_seed);
        } else {
            var msg = e.hasOwnProperty('message') ? e.message : "Error requesting a key"; 
            throw new Error(msg);
        }
    });

}

var placeBet = function(bet, seed, isLow, odds, cur){

    function getRandom(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }

    if(typeof(cur) == 'undefined')
        cur = 10;   // btc as default

    if(typeof(seed) == 'undefined')
        seed = getRandom(1, 999999999);

    if(typeof(odds) == 'undefined')
        odds = 49.5;  // default is 2x game
    
    if(typeof(isLow) == 'undefined')
        isLow = true;
        
    bet = Number(bet).toFixed(8);   // convert floating point to 8 decimal format
    
    var roll = isLow ? 0 : 1;

/* from the docs:
    https://www.peerbet.org/api/dice/?action=roll
    Minimum interval between requests
    2 seconds
    Request parameters
    key API key used to authenticate user.
    roll Roll type. Choices are: 0=Low, 1=High.
    target Roll target number. Example: 49.5000.
    cur Placed bet currency code. Choices are: 10=BTC, 11=LTC, READ MORE. Default is 10/BTC.
    bet Placed bet for current roll. Minimum 0.00000010 BTC (0.0001 LTC/PTC/NTC/...).
    seed Client side seed. Format Integer/Int32. Range 1 - 999,999,999.
*/
    var path = "/api/dice/?action=roll"
        + "&key=" + key
        + "&roll=" + roll
        + "&target=" + odds
        + "&cur=" + cur
        + "&bet=" + bet
        + "&seed=" + seed;

    var rollMsg = isLow ? "low" : "high";

    console.log("Placing a " + rollMsg + " bet for " + bet + " at " + odds + " odds");

    // make the roll
    get(path, onRoll);

}

var onRoll = function(e){

    if(e.hasOwnProperty('game_won')){    
        var isWin = e.game_won > 0;
        var winMsg = isWin ? "won" : "lost";

        rolls++;    // increment roll count

        console.log("Roll " + rolls + " " + winMsg + " " + Number(e.game_pay).toFixed(8));
        
        if(rolls >= max_rolls){
            console.log("Limit of " + max_rolls + " games rolled.");
            process.exit();
        }

        if(e.game_won == 0){
            onLose(e.client_seed);
        } else {
            onWin(e.client_seed);        
        }    

    } else {
        var msg = e.hasOwnProperty('message') ? e.message : "Error rolling the dice :("; 
        throw new Error(msg);    
    }
}

var onWin = function(seed){
	if(onWinReturnToBase) {
		current_bet = base;
		multiplier = 0;  // Reset mulitplier as we're only wanting to stop after max_multiplier consecutive, not additive.
	} else {
		multiplier++;  // increment multiplier count
		current_bet = current_bet * onWinMultiplier;
	}

	if(multiplier >= max_multiplier){
		console.log("Limit of " + max_multiplier + " bet multiplications hit.");
		process.exit();
	} else {
	    console.log("Setting next bet to " + Number(current_bet).toFixed(8));
	    placeBet(current_bet, seed);
	}
}

var onLose = function(seed){
	if(onLoseReturnToBase) {
		current_bet = base;
		multiplier = 0;  // Reset mulitplier as we're only wanting to stop after max_multiplier consecutive, not additive.
	} else {
		multiplier++;  // increment multiplier count
		current_bet = current_bet * onLoseMultiplier;
	}

	if(multiplier >= max_multiplier){
		console.log("Limit of " + max_multiplier + " bet multiplications hit.");
		process.exit();
	} else {
	    console.log("Setting next bet to " + Number(current_bet).toFixed(8));
	    placeBet(current_bet, seed);
	}
}

var start = function(seed){
    placeBet(base, seed);
}

var key = null;
var user = "";  // your peerbet username here
var pwd = "";  // your peerbet password here
var base = 0.0000001;  // our base bet is 10 sats
var current_bet = base; // this changes depending on the onWin / onLose increments
var max_rolls = 200;     // we will stop after this number of rolls
var rolls = 0;          // rolls made so far;
var onWinReturnToBase = true; // next bet will be 'base' if this is true, otherwise multiplied by increment
var onWinMultiplier = 0;   // multiple to increase bet by on win (current_bet = current_bet * onWinMultiplier)
var onLoseReturnToBase = false;  // next bet will be 'base' if this is true, otherwise multiplied by increment
var onLoseMultiplier = 2;  // multiple to increase bet by on lose
var multiplier = 0;  // Number of times the bet has been multiplied so far
var max_multiplier = 6;  // Number of times to mulitply bet, if greater, stop rolling

requestKey(user, pwd);