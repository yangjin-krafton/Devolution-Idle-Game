import sound from './sound.js';
import temperature from './temperature.js';
import smell from './smell.js';
import behavior from './behavior.js';
import hybrid from './hybrid.js';

export default {
  ...sound,
  ...temperature,
  ...smell,
  ...behavior,
  ...hybrid,
};
