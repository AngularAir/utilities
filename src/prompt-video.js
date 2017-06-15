import getNeededPrompts from './utils/get-needed-prompts'

export default promptVideo

function promptVideo(providedValues) {
  return getNeededPrompts(getAllPrompts(), providedValues)
}

function getAllPrompts() {
  return [
    {
      name: 'youTubeId',
      type: 'input',
      message: `What's the YouTube ID`,
    }
  ]
}
