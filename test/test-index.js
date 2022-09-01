import {
  parser,
  trackVariables
} from 'lezer-feel';


describe('lezer-feel', () => {

  it('should parse', () => {

    // then
    parser.parse('foo');
  });


  it('should configure with context', () => {

    // given
    const tracker = trackVariables({
      '+': 1
    });

    // when
    const configuredParser = parser.configure({
      contextTracker: tracker
    });

    // then
    configuredParser.parse('+');
  });

});