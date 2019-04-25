// Copyright 2019, Matt Pennington

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

let level = 1;
let itemType = COLOR_TYPE;
let speed = 1;
let delay = 1500;
let lastPress = 0;


let sequence = [];
let playerSequence = [];
let isPlaying = false;
let isListening = false;
let highScore = 0;


const addItemToSequence = item => {
  const index = Math.floor( Math.random() * 4 );
  sequence.push( itemMap[ itemType ][ index ] );
  
  if ( sequence.length % 3 === 0 ) {
    delay = Math.floor( delay * 0.9 );
  }
};

const playNext = ( subSequence, resolve ) => {
  if ( subSequence.length > 0 ) {
    $( '#display' ).text( `${sequence.length - subSequence.length + 1}. ${subSequence.shift()}` );
    setTimeout( () => playNext( subSequence, resolve ), delay );
  }
  else {
    $( '#display' ).text( 'Your Turn!' );
    resolve();
  }
}

const playItems = () => {
  return new Promise( ( resolve, reject ) => {
    playNext( sequence.slice(), resolve );
  } );
}; 

const wait = () => {
  return new Promise( ( resolve, reject ) => setTimeout( () => resolve(), 2000 ) );
}

const listenForItems = () => {
  return new Promise( async ( resolve, reject ) => {
    isListening = true;
    playerSequence = [];
    await wait();
    lastPress = Date.now();
    const listenInterval = setInterval( () => {
      if ( playerSequence.length >= sequence.length || Date.now() - lastPress > delay ) {
        clearInterval( listenInterval );
        isListening = false;
        const thisSequence = playerSequence.map( action => $( `#button${action}` ).text() );
        if ( JSON.stringify( thisSequence ) !== JSON.stringify( sequence ) ) {
          isPlaying = false;
          console.log( sequence, thisSequence, playerSequence );
        }
        resolve();
      }
    }, 100 );
  } );
};

const playRound = async () => {
  addItemToSequence();

  $( '#display' ).text( `Round ${sequence.length}` );
  await wait();
  await playItems();
  await listenForItems();

  if ( isPlaying ) {
    $( '#display' ).text( `Your score is ${sequence.length}` );
    await wait();
    playRound()
  }
  else {
    new Audio( './audio/game-over.wav' ).play();
    $( '#display' ).text( `Game over. Your score is ${sequence.length - 1}` );
  }
};

const startGame = async () => {
  if ( !isPlaying ) {
    isPlaying = true;
    
    $( '#display' ).text( 'Get Ready!' );
    new Audio( './audio/start.wav' ).play();
    await wait();
    isPlaying = true;
    sequence = [];

    ACTIONS.forEach( action => {
      let item = action;
      switch ( itemType ) {
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

    playRound();
  }
};

$( '#start' ).click( startGame );


const TABS = [ 'play', 'options', 'help', 'about' ];
TABS.forEach( tab => {
  $( `#${tab}-nav` ).click( () => {
    $( '.content' ).fadeOut( 200 );
    setTimeout( () => $( `#${tab}` ).fadeIn(), 210 );
  } );
} );

const ACTIONS = [ 0, 1, 2, 3 ];
ACTIONS.forEach( action => {
  $( `#button${action}` ).click( () => {
    if ( isListening ) {
      lastPress = Date.now();
      playerSequence.push( action );
      $( '#display' ).text( $( `#button${action}` ).text() );
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

$( document ).ready( () => {
  
} );