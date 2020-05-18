const crypto = require("crypto");
const providers = require("../../../lib/lyrics/providers");

const tests = [
  {
    name: "google.com",
    query: "your song ellie goulding",
    lang: "en",
    url: "https://www.google.com/search?q=your+song+ellie+goulding+lyrics",
    hash: "b56c646bf8275561c45291314fa2efe3",
  },
  {
    name: "musixmatch.com",
    query: "your song ellie goulding",
    lang: "en",
    url:
      "https://www.musixmatch.com/lyrics/Made-famous-by-Ellie-Goulding/Your-song",
    hash: "8de3a979f7f8cd799c390bf4f352e02d",
  },
  {
    name: "shazam.com",
    query: "your song ellie goulding",
    lang: "en",
    url: "https://www.shazam.com/track/52873018/your-song",
    hash: "4927cc2fd9c8aa76f1b7faacb5a5be3e",
  },
  {
    name: "azlyrics.com",
    query: "your song ellie goulding",
    lang: "en",
    url: "https://www.azlyrics.com/lyrics/elliegoulding/yoursong.html",
    hash: "1c5fd53029a415286cd9240f13e4f28b",
  },
  {
    name: "lyrics.com",
    query: "your song ellie goulding",
    lang: "en",
    url: "https://www.lyrics.com/lyric/26847304/Ellie+Goulding/Your+Song",
    hash: "074b35d53caa26e545253865aefb6363",
  },
  {
    name: "metrolyrics.com",
    query: "your song ellie goulding",
    lang: "en",
    url: "https://www.metrolyrics.com/your-song-lyrics-ellie-goulding.html",
    hash: "80b20e8ed17b53506611e932de8ece67",
  },
  {
    name: "mojim.com",
    query: "鄧福如 如果有如果",
    lang: "zh",
    url: "https://mojim.com/twy109220x5x4.htm",
    hash: "e8859ab467e37353c1804f10ad4f36bd",
  },
  {
    name: "musica.com",
    query: "Mi fuerza eres tú Las Románticas",
    lang: "es",
    url: "https://www.musica.com/letras.asp?letra=1640467",
    hash: "b603dd1fe43922b7f9087c4b6b0a489b",
  },
  {
    name: "kapook.com",
    query: "GUNGUN - ร้องไห้เพราะคนโง่",
    lang: "th",
    url:
      "https://musicstation.kapook.com/%E0%B8%A3%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B9%84%E0%B8%AB%E0%B9%89%E0%B9%80%E0%B8%9E%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%84%E0%B8%99%E0%B9%82%E0%B8%87%E0%B9%88_Gungun.html",
    hash: "9d0daefc6760e9683f739a0fc42abe54",
  },
  {
    name: "lyricsmint.com",
    query: "Jassie Gill Keh Gayi Sorry",
    lang: "hi",
    url: "https://www.lyricsmint.com/jassie-gill/keh-gayi-sorry",
    hash: "0d7b60207130e9b8bea79bb5ae4769b6",
  },
  {
    name: "gasazip.com",
    query: "여백 정동원",
    lang: "ko",
    url: "https://gasazip.com/2487013",
    hash: "cc2614a76ec31494d98b07b8b0b6ab62",
  },
  {
    name: "uta-net.com",
    query: "あいみょん - マリーゴールド",
    lang: "ja",
    url: "https://www.uta-net.com/song/251631/",
    hash: "390d1f223382eb3df9d71938191b313a",
  },
  {
    name: "buscaletras.com",
    query: "Diosa Myke Towers",
    lang: "es",
    url: "https://www.buscaletras.com/myke-towers/diosa-11/",
    hash: "a6bd787ad09ef32ec356c978fdd41c0f",
  },
  {
    name: "cmtv.com.ar",
    query: "Coverheads - No te vayas mal",
    lang: "es",
    url:
      "https://www.cmtv.com.ar/discos_letras/letra.php?bnid=2118&banda=Coverheads&DS_DS=9207&tmid=115386&tema=NO_TE_VAYAS_MAL_(DON%B4T_GO_AWAY_MAD_-_M%D6TLEY_CR%DCE)",
    hash: "3d1a3d75735a5471143f0f4a215995d4",
  },
  {
    name: "utamap.com",
    query: "あいみょん - マリーゴールド",
    lang: "ja",
    url: "http://www.utamap.com/showkasi.php?surl=k-180808-030",
    hash: "b5b6e8a4a1037035e47e5e08dbbcd783",
  },
  {
    name: "sanook.com",
    query: "คบไม่ได้ - เต้น นรารักษ์",
    lang: "th",
    url: "https://www.sanook.com/music/song/qEfi01dneB3vYEQk5OWCFw==/",
    hash: "841445c7d7022b792e50289c6545513f",
  },
  {
    name: "genius.com",
    query: "your song ellie goulding",
    lang: "en",
    url: "https://api.genius.com/songs/198880?text_format=plain",
    hash: "526c186d59fbc74625b0d2ea68e74907",
  },
  {
    name: "ttlyrics.com",
    query: "如果有如果-鄧福如",
    lang: "zh",
    url: "http://ttlyrics.com/api/download?id=10001",
    hash: "a528d62fad90468425940fb9128166f4",
  },
  {
    name: "sarkisozum.gen.tr",
    query: "Edip Akbayram - Anneler Günü",
    lang: "tr",
    url: "https://www.sarkisozum.gen.tr/en/edip-akbayram/anneler-gunu-lyrics",
    hash: "28b1065e0328615859eba3aeebe64bc8",
  },
  {
    name: "megalyrics.ru",
    query: "Дмитро Гнатюк - Ніч яка місячна",
    lang: "ru",
    url:
      "http://www.megalyrics.ru/lyric/dmitro-gnatiuk/nich-iaka-misiachna.htm",
    hash: "e26682b1600fa5ade028b54dfdf182fc",
  },
  {
    name: "karaoke.ru",
    query: "елка город мой",
    lang: "ru",
    url: "https://www.karaoke.ru/artists/elka/text/gorod-moj/",
    hash: "05d709b00eabfc828e78b4829456288b",
  },
  {
    name: "rus-songs.ru",
    query: "Елка — Около тебя",
    lang: "ru",
    url: "https://rus-songs.ru/elka-okolo-tebya/",
    hash: "2a031fc944078f1a257c05e232f446b1",
  },
  {
    name: "kkbox.com",
    query: "莫文蔚 愛",
    lang: "zh",
    url: "https://www.kkbox.com/tw/tc/song/mLCTim900OY.82O5-2O5-0P4-index.html",
    hash: "756d655de7e3d9b205be37aa3b123d17",
  },
];

describe("provider should return url and lyrics", () => {
  it("should return lyrics", async () => {
    jest.setTimeout(50000);
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(test);
      const provider = providers.find((p) => p.name === test.name);
      const actualURL = await provider.search(test.query, test.lang);
      expect(actualURL).toBe(test.url);
      const actualLyrics = await provider.lyrics(actualURL);
      console.log(`"""${actualLyrics}"""`);
      const actualHash = crypto
        .createHash("md5")
        .update(actualLyrics)
        .digest("hex");
      expect(actualHash).toBe(test.hash);
    }
  });

  it("should return nothing", async () => {
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      if (["google.com"].includes(provider.name)) continue;
      const query = "abcdefgasdalkjfalddsk";
      provider.supported = () => true;
      const url = await provider.search(query);
      expect(url).toBeFalsy();
    }
  });
});
