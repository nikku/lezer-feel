import {
  parser,
  feelHighlighting
} from '..';

describe('types', () => {

  it('should expose parser', () => {

    // then
    parser.parse('foo');
  });


  it('should expose feelHighlighting', () => {

    // then
    feelHighlighting(parser.topNode);
  });

});