const podcastifyVideo = require('../dist/video').default
const promptVideo = require('../dist/prompt-video').default

promptVideo({
  url: 'https://angularair.com',
  artist: 'AngularAir',
}).then(podcastifyVideo)
