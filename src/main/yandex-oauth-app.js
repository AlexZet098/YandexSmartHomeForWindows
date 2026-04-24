const BUILT_IN_YANDEX_OAUTH_CLIENT_ID = '607b763a53b149c8b3e45e043d2513ce';

const YANDEX_OAUTH_CLIENT_ID = process.env.YANDEX_OAUTH_CLIENT_ID || BUILT_IN_YANDEX_OAUTH_CLIENT_ID;

function getYandexOAuthClientId() {
  return YANDEX_OAUTH_CLIENT_ID.trim();
}

module.exports = {
  getYandexOAuthClientId
};
