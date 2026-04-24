# Device type images

Yandex Smart Home user API returns device `type`, `capabilities`, and `properties`, but does not return `icon`, `image`, or `image_url` fields.

Official documentation pages contain static images for every documented device type:

- https://yandex.ru/dev/dialogs/smart-home/doc/en/concepts/device-types

If image files are downloaded, keep them in this directory and map them by normalized device type, for example:

- `devices.types.light.lamp.svg`
- `devices.types.socket.svg`
- `devices.types.thermostat.ac.svg`

The renderer currently falls back to local SVG renderings when no downloaded file is present.
