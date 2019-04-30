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
  'violet',
  'blue',
  'red',
  'green'
];

const MAJ = [
  'G3',
  'C4',
  'E4',
  'G4'
];

const MIN = [
  'G3',
  'C4',
  'Eb4',
  'G4'
];

const DOM = [
  'C4',
  'E4',
  'G4',
  'Bb4'
];

const DIM = [
  'C4',
  'Eb4',
  'Gb4',
  'A4'
];

const SHAPES = [
  'square',
  'circle',
  'star',
  'moon'
]

const itemMap = {
  SOUND: MAJ,
  COLOR: COLORS,
  SHAPE: SHAPES
}

const actionToKey = {
  0: 'a',
  1: 's',
  2: 'd',
  3: 'f'
}

const keyToAction = {
  a: 0,
  s: 1,
  d: 2,
  f: 3
}

// Game options
const options = {
  // level: 1, // number of concurrent items
  highScore: 0, // highest score since page load
  itemType: SOUND_TYPE, // type of game
  delay: 1000 // delay between items in playback
}

// Game state
const state = {
  sequence: [], // The true sequence
  playerSequence: [], // The players input sequence
  isPlaying: false, // true if the game is in progress
  isListening: false, // true if it is the player's turn
  lastPress: Date.now(), // The timestamp of the last time a button was pressed while isListening was equal to true
  delay: options.delay // Time to wait between items for each round
}

// Removes classes and contents from the color/shape display planel
const clearSwatch = () => {
  $( '#swatch' ).removeClass( 'violet blue green red' );
  $( '#swatch' ).empty();
}

// Returns a font awesome element with the appropriate class
const createIcon = ( name ) => {
  const icon = document.createElement( 'i' );
  $( icon ).addClass( 'fa' );
  $( icon ).addClass( `fa-${name}` );
  return icon;
}

// Adds a random item to the sequence
const addItemToSequence = item => {
  const index = Math.floor( Math.random() * 4 );
  state.sequence.push( itemMap[ options.itemType ][ index ] );
};

// Plays a single item from the computer sequence
// @recursive
const playNext = ( subSequence, resolve ) => {
  if ( subSequence.length > 0 ) {
    const item = subSequence.shift();
    const round = state.sequence.length - subSequence.length;

    if ( options.itemType === SOUND_TYPE ) {
      $( '#display' ).text( `${round}` );
      synth.triggerAttackRelease( item, state.delay * .8 / 1000 );
    }
    else if ( options.itemType === COLOR_TYPE ) {
      $( '#display' ).text( `${round}. ${item}` );
      clearSwatch()
      $( '#swatch' ).addClass( item );
    }
    else if ( options.itemType === SHAPE_TYPE ) {
      $( '#display' ).text( `${round}. ${item}` );
      clearSwatch();
      $( '#swatch' ).append( createIcon( item ) );
    }
    else {
      throw `Type not supported ${options.itemType}`;
    }
    
    setTimeout( () => playNext( subSequence, resolve ), state.delay );
  }
  else {
    $( '#display' ).text( 'Your Turn!' );
    clearSwatch()
    resolve();
  }
}

// Plays all items in the computer's sequence.  Promise resolves when complete.
const playItems = () => {
  return new Promise( ( resolve, reject ) => {
    playNext( state.sequence.slice(), resolve );
  } );
}; 

// Wait for t milliseconds. Defaults to 2 seconds if no value supplied. 
const wait = t => {
  return new Promise( ( resolve, reject ) => setTimeout( () => resolve(), t || 2000 ) );
}

// Plays an audio clip and returns a promise that resolves after it is complete
// This is a pretty hacky way to do it
const playClipAndWait = async src => {
  const audio = new Audio( src );
  await audio.play();
  return await wait( audio.duration * 1000 );
}

// Plays a sequence of all tones in the current chord.
// This can probably be improved with the Tone.js transport
const previewSounds = () => {
  return new Promise( ( resolve, reject ) => {
    let c = 0;
    setInterval( () => {
      if ( c < 4 ) {
        synth.triggerAttackRelease( itemMap[ SOUND_TYPE ][ c ], .3 );
        c++;
      }
      else {
        resolve();
      }
    }, 350 );
  } );
}

// Waits for the user to finish the sequence, make an error, or exceed the time limit.
// Ends the current game if appropriate
const listenForItems = () => {
  return new Promise( async ( resolve, reject ) => {
    state.isListening = true;
    state.playerSequence = [];
    await wait();
    state.lastPress = Date.now();
    const listenInterval = setInterval( () => {
      if ( state.playerSequence.length >= state.sequence.length || Date.now() - state.lastPress > ( state.delay * 1.5 ) ) {
        clearInterval( listenInterval );
        state.isListening = false;
        const thisSequence = state.playerSequence.map( action => itemMap[ options.itemType ][ action ] );
        if ( JSON.stringify( thisSequence ) !== JSON.stringify( state.sequence ) ) {
          state.isPlaying = false;
        }
        resolve();
      }
    }, 100 );
  } );
};

// Sets up a single round consisting of one computer turn and one player turn
const playRound = async () => {
  addItemToSequence();

  $( '#display' ).text( `Round ${state.sequence.length}` );
  await wait();
  await playItems();
  await listenForItems();

  $( '#display' ).focus();

  if ( state.isPlaying ) {
    $( '#display' ).text( `Your score is ${state.sequence.length}` );
    await wait();

    if ( state.sequence.length % 3 === 0 ) {
      state.delay = Math.floor( state.delay * 0.75 );
    }
    playRound()
  }
  else {
    await playClipAndWait( './audio/game-over.wav' );
    const score = state.sequence.length - 1;
    if ( score > options.highScore ) {
      options.highScore = score;
    }
    $( '#display' ).text( `Game over. Your score is ${score}.  The high score is ${options.highScore}.` );

    $( '#start' ).show();
    $( '#navigation' ).show();
    $( '#header' ).show();
    $( '#action-buttons' ).hide();
  }
};

// Initializes a new game
const startGame = async () => {
  if ( !state.isPlaying ) {
    state.isPlaying = true;
    state.delay = options.delay;
    state.sequence = [];

    ACTIONS.forEach( action => {
      let item = itemMap[ options.itemType ][ action ];
      $( `#button${action}` ).empty()
      $( `#button${action}` ).removeClass( 'violet blue green red' );
      if ( options.itemType === SOUND_TYPE ) {
        $( `#button${action}` ).text( item );
      }
      else if ( options.itemType === COLOR_TYPE ) {
        $( `#button${action}` ).addClass( item );
      }
      else if ( options.itemType === SHAPE_TYPE) {
        $( `#button${action}` ).append( createIcon( item ) );
      }
      else {
        throw `Bad type ${options.itemType}`;
      }
      $( `#button${action}` ).append( ` (${actionToKey[ action ]})` );
    } );
    
    clearSwatch()
    $( '#action-buttons' ).show();
    $( '#start' ).hide();
    $( '#navigation' ).hide();
    $( '#header' ).hide();

    await playClipAndWait( './audio/start.wav' );
    let getReadyText = `Get Ready! The hotkeys are A: ${itemMap[ options.itemType ][ 0 ]}, S: ${itemMap[ options.itemType ][ 1 ]}, D: ${itemMap[ options.itemType ][ 2 ]}, F: ${itemMap[ options.itemType ][ 3 ]}`;
    $( '#display' ).text( getReadyText );
    await wait( 4000 );

    if ( options.itemType === SOUND_TYPE ) {
      await previewSounds();
      $( '#swatch' ).hide();
    }
    else {
      $( '#swatch' ).show();
    }

    playRound();
  }
};
$( '#start' ).click( startGame );

// Enables the TAB navigation
const TABS = [ 'play', 'options', 'help', 'about' ];
TABS.forEach( tab => {
  $( `#${tab}-nav` ).click( () => {
    if ( !state.isPlaying ) {
      $( `.nav-button` ).removeClass( 'open' );
      $( `#${tab}-nav` ).parent().addClass( 'open' );
      $( '.content' ).fadeOut( 200 );
      setTimeout( () => $( `#${tab}` ).fadeIn(), 210 );
    }
  } );
} );

// Enables the action button listeners
const ACTIONS = [ 0, 1, 2, 3 ];
ACTIONS.forEach( action => {
  $( `#button${action}` ).click( () => {
    if ( state.isListening ) {
      state.lastPress = Date.now();
      state.playerSequence.push( action );
      if ( options.itemType === SOUND_TYPE ) {
        synth.triggerAttackRelease( itemMap[ SOUND_TYPE ][ action ], .1 );
      }
      else if ( options.itemType === COLOR_TYPE || options.itemType === SHAPE_TYPE ) {
        $( '#display' ).text( itemMap[ options.itemType ][ action ] );
      }
    }
    else {
      new Audio( './audio/error.wav' ).play();
    }
  } );
} );

// Define hotkeys
$( document ).on( 'keydown', event => {
  if ( keyToAction.hasOwnProperty( event.key ) ) {
    const action = keyToAction[ event.key ];
    $( `#button${action}` ).click();
    $( `#button${action}` ).addClass( 'active' );
  }
});

$( document ).on( 'keyup', event => {
  if ( keyToAction.hasOwnProperty( event.key ) ) {
    const action = keyToAction[ event.key ];
    $( `#button${action}` ).removeClass( 'active' );
  }
});

// Totally pointless color animation on start button
let startCounter = 0;
setInterval( () => {
  $( '#start' ).removeClass( 'violet blue green red' );
  $( '#start' ).addClass( COLORS[ startCounter % 4 ] );
  startCounter++;
}, 2000 );

// Listen for changes in type
$( '#type-select' ).change( () => {
  if ( !state.isPlaying ) {
    const newType = $( '#type-select' ).val();
    if ( itemMap.hasOwnProperty( newType ) ) {
      options.itemType = $( '#type-select' ).val();  
    }
    else {
      throw `Unsupported game type ${newtype}`;
    }
  }
} );

// Listen for changes in delay
$( '#speed-select' ).change( () => {
  if ( !state.isPlaying ) {
    const newSpeed = $( '#speed-select' ).val();
    if ( newSpeed === 'slowest' ) {
      options.delay = 2500
    }
    else if ( newSpeed === 'slow' ) {
      options.delay = 1500
    }
    else if ( newSpeed === 'fast' ) {
      options.delay = 1000
    }
    else if ( newSpeed === 'fastest' ) {
      options.delay = 750
    }
    else {
      throw `Unsupported game speed ${newSpeed}`;
    }
  }
} );

// // Listen for changes in level
// $( '#level-select' ).change( () => {
//   if ( !state.isPlaying ) {
//     const newLevel = parseInt( $( '#level-select' ).val() );
//     if ( 1 <= newLevel && newLevel <= 4 ) {
//       options.level = newLevel;
//     }
//     else {
//       throw `Unsupported game level ${newLevel}`;
//     }
//   }
// } );

// Listen for changes in delay
$( '#chord-select' ).change( () => {
  if ( !state.isPlaying ) {
    const newChord = $( '#chord-select' ).val();
    if ( newChord === 'maj' ) {
      itemMap[ SOUND_TYPE ] = MAJ;
    }
    else if ( newChord === 'min' ) {
      itemMap[ SOUND_TYPE ] = MIN;
    }
    else if ( newChord === 'dom' ) {
      itemMap[ SOUND_TYPE ] = DOM;
    }
    else if ( newChord === 'dim' ) {
      itemMap[ SOUND_TYPE ] = DIM;
    }
    else {
      throw `Unsupported game chord ${newChord}`;
    }
  }
} );