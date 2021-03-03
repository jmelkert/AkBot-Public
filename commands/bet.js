const read = require("./methods/read.js");
const locked = require("./methods/locked.js");
const Discord = require('discord.js');
const validAmount = require("./methods/validAmount.js");
require('dotenv').config();

module.exports = function (msg, args) {
    if (msg.channel.id != process.env.AKBOT_CHANNEL_ID && msg.channel.id != process.env.TEST_CHANNELID) {
        msg.channel.send('Please use <#' + process.env.AKBOT_CHANNEL_ID + '> for this command.');
        return;
    }

    let matches = read("./commands/matches.json");
    let teams = read("./commands/teams.json");
    const client = msg.client;
    let score = client.getScore.get(msg.author.id);
    //creates mew table if user does not have one yet
    if (!score) {
        score = {
            id: `${msg.author.id}`,
            user: msg.author.id,
            points: 0,
            bids: "",
            amount: ""
        }
    }

    if (args.length == 0) {
        teamMsg = teams.join(", ");
        matchesMsg = matches.join("``` \n```");
        users = client.getUsers.all();
        if (users.length == 0 || users == null) {
            msg.channel.send("This error is not supposed to happen...");
            return;
        }

        users.sort(function(a, b) {
            return ((a.points > b.points) ? -1 : ((a.points == b.points) ? 0 : 1));
        });
        
        let userLeaderboard = [];
        for (var i = 0; i < users.length; i++) {
            
            if (i == 0) {
                userLeaderboard.push(":first_place: <@" + users[i].id + "> - " + users[i].points);
            } else if (i == 1) {
                userLeaderboard.push(":second_place: <@" + users[i].id + "> - " + users[i].points);
            } else if (i == 2) {
                userLeaderboard.push(":third_place: <@" + users[i].id + "> - " + users[i].points);
            } else {
                userLeaderboard.push(" <@" + users[i].id + "> - " + users[i].points);
            }
        }

        userLeaderboardMsg = userLeaderboard.join(" \n")
        const betEmbed = new Discord.MessageEmbed()
            .setColor('#D9D023')
            .setTitle('Current possible bets')
            .setAuthor('AkBot', 'https://i.imgur.com/y21mVd6.png')
            .setDescription('The current teams you can bet on: ```' + teamMsg + "``` \nPlace bets by using the command: ```!bet teamName amount```\nNumbers in () are the multipliers of your points on a correct bet, this is based on odds and current standings of teams.")
            .setThumbnail('https://i.imgur.com/mXodbnH.png')
            .addFields(
                { name: 'Current matches', value: '```' + matchesMsg + ' ```' },
            )
            .addFields(
                { name: 'Leaderboard', value: '' + userLeaderboardMsg + '' },
            )
            .setTimestamp()
        
        msg.channel.send(betEmbed);
        return;
    }

    if (args.length != 2) {
        msg.channel.send("To bid for a team use ```!bid teamName betAmount```");
        return;
    }

    if(locked(null)) {
        msg.channel.send("The bets are currently locked in. You can not bet anymore until new bets have been started by someone with the moderator/board role.");
        return;
    }

    let teamName = args.shift().toLowerCase();
    let bet = parseInt(args[0], 10);

    if (!validAmount(score, bet, msg)) {
        return;
    }

    //check input for !bid teamName bet
    if(!teams.includes(teamName)) {
        msg.channel.send("Team does not exist or is not a Zephyr team. Please make sure you did not mispell the team name or it is in the list with ``!bet``");
        return;
    }

    //if user already has bet on this team
    teamsBet = score.bids.split(',');
    amountBets = score.amount.split(',');
    for (var i = 0; i < amountBets.length; i++) {
        amountBets[i] = parseInt(amountBets[i], 10);
    }

    for (var i = 0; i < teamsBet.length; i++) {
        if (teamsBet[i] === teamName) {
            amountBets[i] += bet;
            score.amount = amountBets.join(',') + ",";
            score.points = score.points - bet;
            client.setScore.run(score);
            msg.channel.send("You have bet " + bet + " points for " + teamName + ". Your current total points is " + score.points + ".");
            return;
        }
    }

    //Everything is fine
    score.bids = score.bids + teamName + ",";
    score.amount = score.amount + args[0] + ",";
    score.points = score.points - bet;
    client.setScore.run(score);
    msg.channel.send("You have bet " + bet + " points for " + teamName + ". Your current total points is " + score.points + ".");
}