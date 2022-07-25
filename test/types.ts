import {
  parser,
  trackVariables
} from '..';

describe('types', () => {

  it('should expose parser', () => {

    // then
    parser.parse('foo');
  });


  it('should expose trackVariables', () => {

    // then
    const tracker = trackVariables({
      foo: 'bar',
      other: 'woop'
    });

  });

});