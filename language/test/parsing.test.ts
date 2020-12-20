import { CharLiteral, NumberLiteral, Var, App, Abs, Let, parse } from '../src/index'

test('general: syntax error', () => {
    expect(() => parse('')).toThrow()
    expect(parse('', true).isAccepted()).toBe(false)
})

test('var: valid', () => {
    expect(parse('True')).toEqual(new Var('True'));
    expect(parse('myIdentifier', true).isAccepted()).toBe(true);
    expect(parse('myBooleans')).toEqual(new Var('myBooleans'));
    expect(parse('3')).toEqual(new NumberLiteral(3));
    expect(parse('add 3')).toEqual(new App(new Var('add'), new NumberLiteral(3)));
    expect(parse('"hi"')).toEqual(new App(new App(new Var(':'), new CharLiteral('h')), new App(new App(new Var(':'), new CharLiteral('i')), new Var('[]'))));
    expect(parse('"I\'m"')).toEqual(new App(new App(new Var(':'), new CharLiteral('I')), new App(new App(new Var(':'), new CharLiteral('\'')), new App(new App(new Var(':'), new CharLiteral('m')), new Var('[]')))));
    expect(parse('h3llo')).toEqual(new Var('h3llo'))
    expect(parse('hell0')).toEqual(new Var('hell0'))
    expect(parse('_')).toEqual(new Var('_'))
    expect(parse('+')).toEqual(new Var('+'))
    expect(parse('-')).toEqual(new Var('-'))
    expect(parse('/')).toEqual(new Var('/'))
    expect(parse('*')).toEqual(new Var('*'))
    expect(parse(':')).toEqual(new Var(':'))
    expect(parse('-3')).toEqual(new NumberLiteral(-3))
    expect(parse('+3')).toEqual(new NumberLiteral(3))
    expect(parse('+ 3')).toEqual(new App(new Var('+'), new NumberLiteral(3)))
    expect(parse('3e2')).toEqual(new NumberLiteral(300))
})

test('var: syntax error', () => {
    expect(() => parse('let')).toThrow()
    expect(() => parse('🤔')).toThrow()
    expect(() => parse('\'my string\'')).toThrow();
    expect(() => parse('->')).toThrow();
})

test('app: valid', () => {
    expect(parse('not True')).toEqual(new App(new Var('not'), new Var('True')));
    expect(parse('not (not True)')).toEqual(new App(new Var('not'), new App(new Var('not'), new Var('True'))));
    expect(parse('(map not) myBooleans')).toEqual(new App(new App(new Var('map'), new Var('not')), new Var('myBooleans')));
    expect(parse('map not myBooleans')).toEqual(new App(new App(new Var('map'), new Var('not')), new Var('myBooleans')));
    expect(parse('a b c d e f')).toEqual(new App(new App(new App(new App(new App(new Var('a'), new Var('b')), new Var('c')), new Var('d')), new Var('e')), new Var('f')))
})

test('app: syntax error', () => {
    expect(() => parse('not let')).toThrow()
    expect(() => parse('not in')).toThrow()
    expect(() => parse('not =')).toThrow()
    expect(() => parse('not ->')).toThrow()
    expect(() => parse('not \\')).toThrow()
    
    expect(() => parse('let not')).toThrow()
    expect(() => parse('in not')).toThrow()
    expect(() => parse('= not')).toThrow()
    expect(() => parse('-> not')).toThrow()
    expect(() => parse('\\ not')).toThrow()
})

test('abs: valid', () => {
    expect(parse('\\x -> x')).toEqual(new Abs('x', new Var('x')))
    expect(parse('(\\x -> x)')).toEqual(new Abs('x', new Var('x')))
    expect(parse('(\\x -> x True)')).toEqual(new Abs('x', new App(new Var('x'), new Var('True'))))
    expect(parse('(\\x -> x True) not')).toEqual(new App(new Abs('x', new App(new Var('x'), new Var('True'))), new Var('not')))
    expect(parse('(\\x -> (\\y -> if x y False)) True False')).toEqual(new App(new App(new Abs('x', new Abs('y', new App(new App(new App(new Var('if'), new Var('x')), new Var('y')), new Var('False')))), new Var('True')), new Var('False')))
})

test('abs: syntax error', () => {
    expect(() => parse('(\\ -> x)')).toThrow()
    expect(() => parse('(\\\\ -> x)')).toThrow()
    expect(() => parse('(\\\\x -> x)')).toThrow()
    expect(() => parse('(\\x = x)')).toThrow()
    expect(() => parse('(\\x --> x)')).toThrow()
    expect(() => parse('(\\x -> \\x)')).toThrow()
})

test('let: valid', () => {
    expect(parse('let x = True in x')).toEqual(new Let('x', new Var('True'), new Var('x')))
    expect(parse('(let x = True in x)')).toEqual(new Let('x', new Var('True'), new Var('x')))
    expect(parse('(let x = myBooleans in map not x)')).toEqual(new Let('x', new Var('myBooleans'), new App(new App(new Var('map'), new Var('not')), new Var('x'))))
    expect(parse('(let x = not in map x myBooleans)')).toEqual(new Let('x', new Var('not'), new App(new App(new Var('map'), new Var('x')), new Var('myBooleans'))))
    expect(parse('(let x = not in map x) myBooleans')).toEqual(new App(new Let('x', new Var('not'), new App(new Var('map'), new Var('x'))), new Var('myBooleans')))
    expect(parse('nub (let x = map not in x) myBooleans')).toEqual(new App(new App(new Var('nub'), new Let('x', new App(new Var('map'), new Var('not')), new Var('x'))), new Var('myBooleans')))
    expect(parse('map (let x = True in (\\y -> if x y (not y))) myBooleans')).toEqual(new App(new App(new Var('map'), new Let('x', new Var('True'), new Abs('y', new App(new App(new App(new Var('if'), new Var('x')), new Var('y')), new App(new Var('not'), new Var('y')))))), new Var('myBooleans')))
})

test('let: syntax error', () => {
    expect(() => parse('(let x = True in )')).toThrow()
    expect(() => parse('(let x = True i x)')).toThrow()
    expect(() => parse('(let x = True in in x)')).toThrow()
    expect(() => parse('(let x = let in x)')).toThrow()
    expect(() => parse('(let x = = in x)')).toThrow()
    expect(() => parse('(let x in x)')).toThrow()
})