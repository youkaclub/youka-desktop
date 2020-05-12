const crypto = require("crypto");
const providers = require("../../../lib/lyrics/providers");

const tests = [
  [
    "google.com",
    "your song ellie goulding",
    "https://www.google.com/search?q=your+song+ellie+goulding+lyrics",
    "b56c646bf8275561c45291314fa2efe3",
  ],
  [
    "musixmatch.com",
    "your song ellie goulding",
    "https://www.musixmatch.com/lyrics/Ellie-Goulding/Your-Song",
    "374bed8bb9c2686a6513fddb315ffe92",
  ],
  [
    "shazam.com",
    "your song ellie goulding",
    "https://www.shazam.com/track/225457523/your-song",
    "31e23108bd1dc057f0754cd6d08ccf17",
  ],
  [
    "azlyrics.com",
    "your song ellie goulding",
    "https://www.azlyrics.com/lyrics/elliegoulding/yoursong.html",
    "1c5fd53029a415286cd9240f13e4f28b",
  ],
  [
    "lyrics.com",
    "your song ellie goulding",
    "https://www.lyrics.com/lyric/26847304/Ellie+Goulding/Your+Song",
    "074b35d53caa26e545253865aefb6363",
  ],
  [
    "metrolyrics.com",
    "your song ellie goulding",
    "https://www.metrolyrics.com/your-song-lyrics-ellie-goulding.html",
    "80b20e8ed17b53506611e932de8ece67",
  ],
  [
    "mojim.com",
    "your song ellie goulding",
    "https://mojim.com/usy108268x5x54.htm",
    "4a4050639a631caecdd7883c8e860e42",
  ],
  [
    "musica.com",
    "your song ellie goulding",
    "https://www.musica.com/letras.asp?letra=1929260",
    "ed664579bbdd2eabc0f3cdb6ff19fc2d",
  ],
  [
    "kapook.com",
    "GUNGUN - ร้องไห้เพราะคนโง่",
    "https://musicstation.kapook.com/%E0%B8%A3%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B9%84%E0%B8%AB%E0%B9%89%E0%B9%80%E0%B8%9E%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%84%E0%B8%99%E0%B9%82%E0%B8%87%E0%B9%88_Gungun.html",
    "9d0daefc6760e9683f739a0fc42abe54",
  ],
  [
    "lyricsmint.com",
    "Jassie Gill Keh Gayi Sorry",
    "https://www.lyricsmint.com/jassie-gill/keh-gayi-sorry",
    "0d7b60207130e9b8bea79bb5ae4769b6",
  ],
  [
    "gasazip.com",
    "여백 정동원",
    "https://gasazip.com/2487013",
    "cc2614a76ec31494d98b07b8b0b6ab62",
  ],
  [
    "uta-net.com",
    "あいみょん - マリーゴールド",
    "https://www.uta-net.com/song/251631/",
    "390d1f223382eb3df9d71938191b313a",
  ],
  [
    "buscaletras.com",
    "Diosa Myke Towers",
    "https://www.buscaletras.com/myke-towers/diosa-11/",
    "a6bd787ad09ef32ec356c978fdd41c0f",
  ],
  [
    "cmtv.com.ar",
    "Coverheads - No te vayas mal",
    "https://www.cmtv.com.ar/discos_letras/letra.php?bnid=2118&banda=Coverheads&DS_DS=9207&tmid=115386&tema=NO_TE_VAYAS_MAL_(DON%B4T_GO_AWAY_MAD_-_M%D6TLEY_CR%DCE)",
    "3d1a3d75735a5471143f0f4a215995d4",
  ],
  [
    "utamap.com",
    "あいみょん - マリーゴールド",
    "http://www.utamap.com/showkasi.php?surl=k-180808-030",
    "b5b6e8a4a1037035e47e5e08dbbcd783",
  ],
  [
    "sanook.com",
    "คบไม่ได้ - เต้น นรารักษ์",
    "https://www.sanook.com/music/song/qEfi01dneB3vYEQk5OWCFw==/",
    "841445c7d7022b792e50289c6545513f",
  ],
  [
    "genius.com",
    "your song ellie goulding",
    "https://api.genius.com/songs/198880?text_format=plain",
    "526c186d59fbc74625b0d2ea68e74907",
  ],
  [
    "ttlyrics.com",
    "如果有如果-鄧福如",
    "http://ttlyrics.com/api/download?id=10001",
    "a528d62fad90468425940fb9128166f4",
  ],
  [
    "sarkisozum.gen.tr",
    "Edip Akbayram - Anneler Günü",
    "https://www.sarkisozum.gen.tr/en/edip-akbayram/anneler-gunu-lyrics",
    "28b1065e0328615859eba3aeebe64bc8",
  ],
  [
    "megalyrics.ru",
    "Дмитро Гнатюк - Ніч яка місячна",
    "http://www.megalyrics.ru/lyric/dmitro-gnatiuk/nich-iaka-misiachna.htm",
    "e26682b1600fa5ade028b54dfdf182fc",
  ],
];

describe("provider should return url and lyrics", () => {
  it("should return lyrics", async () => {
    jest.setTimeout(30000);
    for (let i = 0; i < tests.length; i++) {
      const [name, query, url, hash] = tests[i];
      console.log(name, query, url, hash);
      const provider = providers.find((p) => p.name === name);
      const actualURL = await provider.search(query);
      expect(actualURL).toBe(url);
      const actualLyrics = await provider.lyrics(actualURL);
      console.log(actualLyrics);
      const actualHash = crypto
        .createHash("md5")
        .update(actualLyrics)
        .digest("hex");
      expect(actualHash).toBe(hash);
    }
  });
});
