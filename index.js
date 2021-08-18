const { Telegraf } = require('telegraf')
const admin = require('firebase-admin');

//for all request search on telegram @Ganzio

const port = process.env.PORT

const serviceAccount = JSON.parse(process.env.FIREBASE);

var API_TOKEN = process.env.TOKEN;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function setLista(array) {
    console.log("Insert array: " + array);
    await db.collection('boni').doc('lista').set({ lista: array })
}

async function setUnMatched(array) {
    await db.collection('boni').doc('listaUnMatched').set({ listaUnMatched: array })
}

async function setMatched(array) {
    await db.collection('boni').doc('listaMatched').set({ listaMatched: array })
}

async function getLista() {
    return (await db.collection('boni').doc('lista').get()).data().lista
}

async function getListaUnMatched() {
    return (await db.collection('boni').doc('listaUnMatched').get()).data().listaUnMatched
}

async function getListaMatched() {
    return (await db.collection('boni').doc('listaMatched').get()).data().listaMatched
}

async function setShip(ship) {
    console.log("Insert ship: " + ship);
    await db.collection('boni').doc('ship').set({ ship: ship })
}


async function getShip() {
    return (await db.collection('boni').doc('ship').get()).data().ship
}

async function setShipDate(date) {
    console.log("Insert ship: " + date);
    await db.collection('boni').doc('shipDate').set({ date: date })
}

async function getShipDate() {
    return (await db.collection('boni').doc('shipDate').get()).data().date
}


process.once('SIGINT', () => {
    bot.stop('SIGINT')
    console.log("catched SIGINT");
    process.exit(0);
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM')
    console.log("catched SIGTERM");
    process.exit(0);
});

const gifs = ["https://tenor.com/bvk8S.gif", "https://tenor.com/bkKml.gif", "https://tenor.com/bm9Ca.gif", "https://tenor.com/bu0bY.gif", "https://tenor.com/bwrO8.gif",
    "https://tenor.com/bkeT0.gif", "https://tenor.com/bAH3t.gif", "https://tenor.com/bwGem.gif", "https://tenor.com/bttwp.gif"
]



const bot = new Telegraf(API_TOKEN)

bot.start((context) => {
    console.log('Servizio avviato...')
    context.reply('Servizio ECHO avviato')
})

bot.on("new_chat_members", context => {
    context.replyWithHTML("Benvenutə".bold() + `\nAbbonatə o no, rimarrai sempre troppə bonə! L'importante è rimanere attivə qui e su Twitch.\n\nRicorda anche di:\n🐸-Lavare le manine prima dei pasti.\n🐸-Essere horny (entro i limiti della civiltà)\n🐸-Chiedere il permesso ai mod per lo spam.\n🐸-Essere rispettosə (niente razzismo,  omotransfobia e offese).\n\nRispetta queste semplici regole o qualcuno potrebbe morire per cause sconosciute.\n\nuwu out of context`);
    addToListaShip(context);
})

bot.on("left_chat_member", cxt => {
    cxt.reply("Goodbye");
    removeFromListaShip(cxt);
})

bot.command('ship', async(ctx) => {
    var unMatched = await getListaUnMatched();
    var lista = await getLista();
    var partecipant = unMatched.length > 2 ? unMatched : lista;
    var lastShip = await getShip();
    var lastShipDate = await getShipDate();
    var time;
    if (lastShipDate != null) {
        let lastDate = new Date(lastShipDate._seconds * 1000);
        lastDate.setHours(0);
        lastDate = lastDate.getTime();
        time = getTimeRemaining(lastDate);
    }
    if (lastShipDate == undefined || lastShipDate == null || time >= 24) {
        let riuscita = false;
        while (!riuscita) {
            try {
                var numberOfElements = partecipant.length - 1;
                var random1 = getRandomIntInclusive(0, numberOfElements);
                var user1 = (await ctx.getChatMember(partecipant[random1])).user.username;
                var random2 = getRandomIntInclusive(0, numberOfElements);
                while (random1 === random2) {
                    random2 = getRandomIntInclusive(0, numberOfElements);
                }
                var user2 = (await ctx.getChatMember(partecipant[random2])).user.username;
                console.log(`${random1} e ${random2} su ${numberOfElements} ${partecipant[random1]} ${partecipant[random2]}`)
                lastShip = `❤` + "Ship del giorno".bold() + `💙` + "\n@" + user1 + " + @" + user2 + "= " + `💜`;
                riuscita = true;
            } catch (e) {
                console.error(e);
            }
        }
        let newTime = new Date();
        let tomorrow = newTime;
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0);
        tomorrow.setMinutes(0);
        tomorrow.setSeconds(0);
        await setShipDate(tomorrow);
        await setShip(lastShip);

        var matched = lista == unMatched ? [] : await getListaMatched();
        matched.push(partecipant[random1]);
        matched.push(partecipant[random2]);

        await setMatched(matched);

        partecipant = partecipant.filter((ele) => {
            return ele != partecipant[random1] && ele != partecipant[random2]
        })
        await setUnMatched(partecipant);
    }
    let message = "" + lastShip + "La nuova ship del giorno potrà essere scelta tra... " + (getTimeRemaining(new Date().getTime())) + " ore";
    ctx.replyWithHTML(message);
})

bot.command('addme', (ctx) => {
    addToListaShip(ctx);
})

bot.command("removeme", (ctx) => {
    removeFromListaShip(ctx);
})

bot.command('live', (ctx) => {
    ctx.reply("🟣SchedulONA🟣\nLunedì - 21:30 - Just Chatting\nMercoledì - 21:30 - Il gioco varia\nSabato - 15:00 - Animal Crossing\nLink canale ⬇ ⬇ ⬇\nhttps://www.twitch.tv/ruby_rust");
})

bot.command('list', async(ctx) => {
    const partecipant = await getLista();
    let toRet = "Passeggeri della Nave🛳 ❤:\n";
    for (let ele of partecipant) {
        try {
            toRet += (await ctx.getChatMember(ele)).user.username + ","
        } catch (e) {
            console.error(e)
        }
    }
    ctx.replyWithHTML(toRet.substring(0, toRet.length - 1));
})

bot.command('matched', async(ctx) => {
    const partecipant = await getListaMatched();
    let toRet = "Passeggeri della Nave che hanno trovato il loro BONO 🛳 ❤:\n";
    for (let ele of partecipant) {
        toRet += (await ctx.getChatMember(ele)).user.username + ","
    }
    ctx.replyWithHTML(toRet.substring(0, toRet.length - 1));
})

bot.command('unmatched', async(ctx) => {
    const partecipant = await getListaUnMatched();
    let toRet = "Passeggeri della Nave soli e soletti 🛳 💔:\n";
    for (let ele of partecipant) {
        toRet += (await ctx.getChatMember(ele)).user.username + ","
    }
    ctx.replyWithHTML(toRet.substring(0, toRet.length - 1));
})

bot.command('horny', (ctx) => {
    let url = gifs[getRandomIntInclusive(0, gifs.length - 1)];
    ctx.replyWithDocument(url);
})


bot.command('poll', async(ctx) => {
    let text = ctx.update.message.text;
    let array = text.split("*");
    if (array.length > 0) {
        let argument = array[1];
        if (argument != undefined)
            ctx.replyWithPoll(
                'Cosa ne pensi di ' + argument + '?', ['C A L P E S T A M I 🌟', 'BONKAMI! 🔨', 'Bertami 😥'], { is_anonymous: false }
            )
        else
            ctx.reply("Commando errato, prova a inserire l'argomento tra gli asterischi e ridare il commando");
    } else
        ctx.reply("Commando errato, prova a inserire l'argomento tra gli asterischi e ridare il commando");
})

function getTimeRemaining(momentInteressed) {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0);
    tomorrow = tomorrow.getTime()
    const total = tomorrow - momentInteressed;
    const secondi = total / 1000;
    const minuti = secondi / 60;
    let ore = minuti / 60;
    console.log("ORE",ore)
    ore = ore.toFixed(0);
    console.log("ORE",ore)
    return ore;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //Il max è incluso e il min è incluso
}

async function addToListaShip(ctx) {
    var user = ctx.update.message.from;

    var partecipant = await getLista();
    if (!partecipant.includes(user.id)) {
        ctx.reply("Abbiamo un nuovo compagno qui sulla nave: " + user.username);
        partecipant.push(user.id);
        setLista(partecipant);
    } else {
        ctx.reply("Bono già inserito");
    }
}

async function removeFromListaShip(ctx) {
    var user = ctx.update.message.from;
    var partecipant = await getLista();
    if (partecipant.includes(user.id)) {
        ctx.reply("Bono rimosso: " + user.username);
        partecipant = partecipant.filter(ele => {
            return ele != user.id;
        })
        setLista(partecipant);
    } else {
        ctx.reply("Bono non inserito");
    }
}

bot.launch({
        webhook: {
            domain: 'https://bot-boni.herokuapp.com',
            port: port
        }
    })
    // bot.launch();
