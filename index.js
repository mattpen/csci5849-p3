// Copyright 2019, Matt Pennington

// Synthesizer for all musical tones
const synth = new Tone.Synth({
  oscillator  : {
    type  : 'triangle'
  },
  envelope  :{
    attack: 0.01,
    decay: 0.1,
    sustain: 0.5,
    release: 1,
    attackCurve: 'linear',
    decayCurve: 'exponential',
    releaseCurve: 'exponential'
  }
}).toMaster()


// Constants
const SOUND_TYPE = 'SOUND';
const COLOR_TYPE = 'COLOR';
const SHAPE_TYPE = 'SHAPE';

const COLORS = [
  'red',
  'blue',
  'green',
  'indigo'
];

const SOUNDS = [
  'G3',
  'C4',
  'E4',
  'G4'
];

const SHAPES = [
  'square',
  'circle',
  'star',
  'moon'
]

const itemMap = {
  SOUND: SOUNDS,
  COLOR: COLORS,
  SHAPE: SHAPES
}

// Game options
const options = {
  level: 1,
  itemType: COLOR_TYPE,
  delay: 1000,
  lastPress: 0
}

// Game state
const state = {
  sequence: [],
  playerSequence: [],
  isPlaying: false,
  isListening: false,
  highScore: 0
}


const addItemToSequence = item => {
  const index = Math.floor( Math.random() * 4 );
  state.sequence.push( itemMap[ options.itemType ][ index ] );
  
  options.delay = Math.floor( options.delay * 0.9 );
};

const playNext = ( subSequence, resolve ) => {
  if ( subSequence.length > 0 ) {
    if ( options.itemType === SOUND_TYPE ) {
      synth.triggerAttackRelease( subSequence.shift(), options.delay * .9 / 1000 );
    }
    else if ( options.itemType === COLOR_TYPE ) {
      $( '#display' ).text( `${state.sequence.length - subSequence.length + 1}. ${subSequence.shift()}` );
    }
    
    setTimeout( () => playNext( subSequence, resolve ), options.delay );
  }
  else {
    $( '#display' ).text( 'Your Turn!' );
    resolve();
  }
}

const playItems = () => {
  return new Promise( ( resolve, reject ) => {
    playNext( state.sequence.slice(), resolve );
  } );
}; 

// async/await - do nothing for 2 seconds
const wait = () => {
  return new Promise( ( resolve, reject ) => setTimeout( () => resolve(), 2000 ) );
}

const previewSounds = () => {
  return new Promise( ( resolve, reject ) => {
    let c = 0;
    setInterval( () => {
      if ( c < 4 ) {
        synth.triggerAttackRelease( SOUNDS[ c ], .3 );
        c++;
      }
      else {
        resolve();
      }
    }, 350);
  } );
}

const listenForItems = () => {
  return new Promise( async ( resolve, reject ) => {
    state.isListening = true;
    state.playerSequence = [];
    await wait();
    options.lastPress = Date.now();
    const listenInterval = setInterval( () => {
      if ( state.playerSequence.length >= state.sequence.length || Date.now() - options.lastPress > ( options.delay * 1.5 ) ) {
        clearInterval( listenInterval );
        state.isListening = false;
        const thisSequence = state.playerSequence.map( action => $( `#button${action}` ).text() );
        if ( JSON.stringify( thisSequence ) !== JSON.stringify( state.sequence ) ) {
          state.isPlaying = false;
          console.log( state.sequence, thisSequence, state.playerSequence );
        }
        resolve();
      }
    }, 100 );
  } );
};

const playRound = async () => {
  addItemToSequence();

  $( '#display' ).text( `Round ${state.sequence.length}` );
  await wait();
  await playItems();
  await listenForItems();

  if ( state.isPlaying ) {
    $( '#display' ).text( `Your score is ${state.sequence.length}` );
    await wait();
    playRound()
  }
  else {
    new Audio( './audio/game-over.wav' ).play();
    $( '#display' ).text( `Game over. Your score is ${state.sequence.length - 1}` );
  }
};

const startGame = async () => {
  if ( !state.isPlaying ) {
    state.isPlaying = true;
    
    $( '#display' ).text( 'Get Ready!' );
    new Audio( './audio/start.wav' ).play();

    await wait();
    state.isPlaying = true;
    state.sequence = [];

    ACTIONS.forEach( action => {
      let item = action;
      switch ( options.itemType ) {
        case SOUND_TYPE:
          item = SOUNDS[ action ];
          break;
        case COLOR_TYPE:
          item = COLORS[ action ];
          break;
        case SHAPE_TYPE:
          item = SHAPES[ action ];
          break;
        default:
          throw "Bad type";
      }
      $( `#button${action}` ).text( item );
    } );

    if ( options.itemType === SOUND_TYPE ) {
      await previewSounds();
    }

    playRound();
  }
};

$( '#start' ).click( startGame );


const TABS = [ 'play', 'options', 'help', 'about' ];
TABS.forEach( tab => {
  $( `#${tab}-nav` ).click( () => {
    if ( !state.isPlaying ) {
      $( '.content' ).fadeOut( 200 );
      setTimeout( () => $( `#${tab}` ).fadeIn(), 210 );
    }
  } );
} );

const ACTIONS = [ 0, 1, 2, 3 ];
ACTIONS.forEach( action => {
  $( `#button${action}` ).click( () => {
    if ( state.isListening ) {
      options.lastPress = Date.now();
      state.playerSequence.push( action );
      if ( options.itemType === SOUND_TYPE ) {
        synth.triggerAttackRelease( itemMap[ SOUND_TYPE ][ action ], .1 );
      }
      else if ( options.itemType === COLOR_TYPE ) {
        $( '#display' ).text( $( `#button${action}` ).text() );
      }
    }
    else {
      new Audio( './audio/error.wav' ).play();
    }
  } );
} );

const HOTKEYS = [ 'a', 's', 'd', 'f' ];
document.addEventListener("keydown", event => {
  if ( event.key === 'a' ) {
    $( '#button0' ).click()
  }
  else if ( event.key === 's' ) {
    $( '#button1' ).click() 
  }
  else if ( event.key === 'd' ) {
    $( '#button2' ).click()
  }
  else if ( event.key === 'f' ) {
    $( '#button3' ).click()
  }
});