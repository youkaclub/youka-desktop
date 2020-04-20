<p align="center"><img src="public/logo.ico" width='80px'/></p>
<h2 align="center"><b>Youka</b></h2>
<h4 align="center">sing karaoke, any song, any language</h4>

- Read about Youka on [The Verge](https://www.theverge.com/tldr/2020/2/19/21144452/youtube-youka-club-karaoke-lyrics).
- Visit the project's website at <https://www.youka.club>.
- Follow Youka on [Twitter](https://twitter.com/youka_club).
- Join our [Discord](https://discord.gg/yMXv8qw)
- Become a [Patreon](https://www.patreon.com/getyouka).

[Watch a Demo](https://vimeo.com/401471507)
[![Watch the demo](https://static.youka.club/demo.jpg)](https://vimeo.com/401471507)

## Getting Started

```
$ git clone https://github.com/youkaclub/youka-desktop.git
$ cd youka-desktop
$ npm install
$ npm start
# wait for "Compiled successfully!" message then refresh (Cmd+R) the electron window.
```

## How it works

- Search on YouTube using [youka@youtube](https://github.com/youkaclub/youka-youtube)
- Search lyrics using [youka@lyrics](https://github.com/youkaclub/youka-lyrics)
- Download video using [ytdl-core](https://github.com/fent/node-ytdl-core)
- Split vocals from instruments using [spleeter](https://github.com/deezer/spleeter)
- Align lyrics to vocals using [aeneas](https://github.com/readbeyond/aeneas)
- Create 3 videos (instruments only, vocals only, original video) using [FFmpeg](https://www.ffmpeg.org)
- Show you the results using [Plyr](https://github.com/sampotts/plyr)

---

If you distribute a copy or make a fork of the project, you have to credit this project as the source.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/.

---

Copyright © 2020 Youka Project - Released under the [GPL v3 license](LICENSE.txt).
