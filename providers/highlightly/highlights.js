const client = require("./client");

/*
==================================================
RAZ — HIGHLIGHTLY HIGHLIGHTS PROVIDER
==================================================

Highlightly provides verified match highlight
content through the /highlights endpoint.

This provider keeps the raw Highlightly response
out of the frontend and gives RAZ a stable format.

IMPORTANT:

This is VIDEO / HIGHLIGHT content.

It is NOT a structured player-event feed.

It does NOT provide:
- metres
- tackles
- carries
- try assists
- individual match statistics

Those remain separate RAZ Match Intelligence data.
==================================================
*/

/*
==================================================
GET MATCH HIGHLIGHTS
==================================================
*/

async function getMatchHighlights(
  matchId
) {
  try {
    if (
      matchId === undefined ||
      matchId === null ||
      matchId === ""
    ) {
      return [];
    }

    const params = {
      matchId: Number(matchId),
    };

    console.log(
      "🎥 HIGHLIGHTLY HIGHLIGHTS SEARCH:",
      params
    );

    const response =
      await client.get(
        "/highlights",
        {
          params,
        }
      );

    const data =
      Array.isArray(
        response.data?.data
      )
        ? response.data.data
        : [];

    console.log(
      `🎥 HIGHLIGHTLY HIGHLIGHTS FOUND: ${data.length}`
    );

    return data.map(
      (highlight) => ({
        id:
          highlight.id ??
          null,

        type:
          highlight.type ??
          "",

        title:
          highlight.title ??
          "",

        description:
          highlight.description ??
          null,

        imageUrl:
          highlight.imgUrl ??
          "",

        url:
          highlight.url ??
          "",

        embedUrl:
          highlight.embedUrl ??
          "",

        channel:
          highlight.channel ??
          "",

        source:
          highlight.source ??
          "",

        category:
          highlight.category ??
          "",

        matchId:
          highlight.match?.id ??
          Number(matchId),

        raw:
          highlight,
      })
    );
  } catch (error) {
    if (error.response) {
      console.error(
        "========== HIGHLIGHTLY HIGHLIGHTS ERROR =========="
      );

      console.error(
        "STATUS:",
        error.response.status
      );

      console.error(
        "RESPONSE:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );

      console.error(
        "==================================================="
      );
    } else {
      console.error(
        "❌ HIGHLIGHTLY HIGHLIGHTS NETWORK ERROR:",
        error.message
      );
    }

    throw error;
  }
}

/*
==================================================
EXPORTS
==================================================
*/

module.exports = {
  getMatchHighlights,
};