# [1.0.0-beta.5](https://github.com/httpland/cors/compare/1.0.0-beta.4...1.0.0-beta.5) (2022-09-26)


### Features

* **responses:** add cors and preflight response function ([1355f14](https://github.com/httpland/cors/commit/1355f14103b713011b676a24304d9b6faf54f7b9))

# [1.0.0-beta.4](https://github.com/httpland/cors/compare/1.0.0-beta.3...1.0.0-beta.4) (2022-09-17)


### Bug Fixes

* **cors:** handler must not call when the request is preflight by default ([e887dc7](https://github.com/httpland/cors/commit/e887dc739cfc989e916c7cf7dc2d61acf87b3e8c))


### Features

* **cors:** add event handler for preflight and simple request ([f8a1751](https://github.com/httpland/cors/commit/f8a17518b99fdff7556b7576372a3c866333549c))
* **cors:** improve to cors definition accept dynamic function ([6e560fb](https://github.com/httpland/cors/commit/6e560fb67b3bbd966c0eaa4884da1cf0a70f667c))
* **cors:** improve types to readonly ([7bddf85](https://github.com/httpland/cors/commit/7bddf8597420a529123c1d861fbcf8d3745fa3c9))
* **cors:** pass context to dynamic definition ([8fc1772](https://github.com/httpland/cors/commit/8fc1772bbf885960d88eaa21760ab3f7e08d44c1))
* **cors:** rename cors options field name ([918e055](https://github.com/httpland/cors/commit/918e05597a5b17c997556fca1abf74b8adb3624d))
* **utils:** rename `isCrossOriginRequest` from `isCorsRequest` ([7138476](https://github.com/httpland/cors/commit/71384760b7a86982a7e6648c1c5dd37fbb979044))

# [1.0.0-beta.3](https://github.com/httpland/cors/compare/1.0.0-beta.2...1.0.0-beta.3) (2022-09-15)


### Features

* **cors:** change options field name, add vary header to cors response ([c3a149d](https://github.com/httpland/cors/commit/c3a149d8d7c86a7ec712a8ce10aaade2e718e631))

# [1.0.0-beta.2](https://github.com/httpland/cors/compare/1.0.0-beta.1...1.0.0-beta.2) (2022-08-16)


### Bug Fixes

* **cors:** format access-control-allow-methods header ([6bdac27](https://github.com/httpland/cors/commit/6bdac27a90d33d08d55b0b53767344edc3382891))


### Features

* **utils:** export `isCorsRequest` and `isPreflightRequest` functions ([73ffb5f](https://github.com/httpland/cors/commit/73ffb5f6cf9093277be8f380d8ab4a5e9339e3cc))
* **utils:** rename `isCorsPreflightRequest` instead of `isPreflightRequest` ([f5773d8](https://github.com/httpland/cors/commit/f5773d8ecd4df541946f63b114509619c22620a0))

# 1.0.0-beta.1 (2022-08-09)


### Features

* **cors:** add basic cors implementation and `withCors` function ([b76a931](https://github.com/httpland/cors/commit/b76a9310e01cf13d1144729d8428611dd181694b))
