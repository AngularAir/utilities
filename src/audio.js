import path from 'path'
import spawn from 'spawn-command'
import shellEscape from 'shell-escape'
import filenamify from 'filenamify'
import ffmpegPath from './ffmpeg-path'
import fs from 'fs'

export {podcastifyAudio as default, analyzeAudio, optimizeAudio}

function podcastifyAudio(episode) {
  return Promise.resolve(episode)
    .then(analyzeAudio)
    .then(optimizeAudio)
    .catch(err => console.error(err))
}

function analyzeAudio(episode) {
  console.log('Analyzing audio levels')
  return new Promise((resolve, reject) => {
    const command = shellEscape([
      ffmpegPath,
      '-ss', '00:05:00.00',
      '-t', '00:15:00.00',
      '-i', episode.file,
      '-af', 'volumedetect',
      '-f', 'null', '/dev/null',
    ])
    console.log(`Running: ${command}`)

    let buffer = ''
    const options = {stdio: [process.stdin, process.stdout, 'pipe']}
    spawn(command, options)
      .stderr.on('data', (data) => {
        const chunk = data.toString()
        buffer += chunk
        console.log(chunk)
      })
      .on('error', (err) => {
        reject(err)
      })
      .on('close', () => {
        const maxVol = /max_volume: (-?[\d\.]+) dB/.exec(buffer)

        if (!maxVol) {
          return resolve({episode, gain: 0})
        }

        console.log(`Detected max volume: ${maxVol[1]}dB`)
        const gain = -parseFloat(maxVol[1])

        return resolve({episode, gain})
      })
  })
}

function optimizeAudio({episode, gain}) {
  const {
    file,
    title,
    year,
    url,
    artist,
    shortArtist = episode.artist,
  } = episode
  const outputFilename = filenamify(`${artist}.mp3`, {replacement: '-'})
  const outputPath = path.resolve(file, '../', outputFilename)
  const command = shellEscape([
    ffmpegPath,
    '-i', file,
    '-acodec', 'mp3',
    '-ab', '96k',
    '-ac', '1',
    '-id3v2_version', '3',
    '-write_id3v1', '1',
    '-af', `volume=${gain}dB`,
    '-metadata', `title=${title}`,
    '-metadata', `artist=${episode.artist}`,
    '-metadata', `track=${artist.split('ngAir ')[1]}`,
    '-metadata', `date=${year}`,
    '-metadata', 'language=eng',
    '-metadata', `comment=${url}`,
    outputPath,
  ])
  const options = {stdio: 'inherit'}
  console.log(`Running: ${command}`)
  spawn(command, options).on('exit', () => {
    console.log(`Deleting ${file}`)
    fs.unlinkSync(file)
    process.exit
  })
}
