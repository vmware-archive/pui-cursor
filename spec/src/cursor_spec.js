import '../spec_helper';
import Cursor from '../../src/cursor';

describe('Cursor', () => {
  let subject, data, cells, callbackSpy;

  beforeEach(() => {
    cells = [{cell_id: 4}, {cell_id: 32}, {cell_id: 44}];
    data = {scaling: 'containers', cells, desiredLrps: [], rules: {1: {name: 'the golden rule'}}};
    callbackSpy = jasmine.createSpy('callback');
    subject = new Cursor(data, callbackSpy);
  });

  describe('#nextTick', () => {
    let callbackSpy;
    beforeEach(() => {
      callbackSpy = jasmine.createSpy('callback');
    });

    it('calls the callback when the promise is resolved', () => {
      subject.nextTick(callbackSpy);
      expect(callbackSpy).not.toHaveBeenCalled();
      MockPromises.tick();
      expect(callbackSpy).toHaveBeenCalled();
    });

    it('throws an exception when an error is thrown in the callback', () => {
      const error = 'some error';
      callbackSpy.and.callFake(() => { throw new Error(error); });
      subject.nextTick(callbackSpy);
      expect(() => {
        MockPromises.tick(2);
        jasmine.clock().tick(1);
      }).toThrowError(error);
    });
  });

  describe('with async true', () => {
    beforeEach(() => {
      Cursor.async = true;
    });

    describe('#get', () => {
      it('returns the data at the specified key', () => {
        expect(subject.get('scaling')).toEqual('containers');
        expect(subject.get('cells', 0)).toEqual(cells[0]);
        expect(subject.get('cells', 0, 'cell_id')).toEqual(cells[0].cell_id);
        expect(subject.get()).toEqual(data);
      });
    });

    describe('#refine', () => {
      it('returns a new cursor that points to the given path', () => {
        const cursor = subject.refine('scaling');
        expect(cursor).toEqual(jasmine.any(Cursor));
        expect(cursor.get()).toEqual('containers');
      });

      it('can find objects in arrays', () => {
        expect(subject.refine('cells', cells[1]).get()).toBe(cells[1]);
      });

      it('works if the path is a single object', () => {
        expect(subject.refine('cells').refine(cells[1]).get()).toBe(cells[1]);
      });

      it('returns a cursor that updates in the expected way', () => {
        const cell = {cell_id: 'new'};
        subject.refine('cells').refine(cells[1]).set(cell);
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });

      describe('for a nested objects in arrays', () => {
        let nested;
        beforeEach(() => {
          nested = [{id: 1}, {id: 2}];
          cells = [{cell_id: 4}, {cell_id: 32, nested}, {cell_id: 44}];
          data = {cells};
          subject = new Cursor(data, callbackSpy);
        });

        it('returns the expected cursor', () => {
          expect(subject.refine('cells', cells[1], 'nested', nested[0]).get()).toEqual(nested[0]);
        });
      });
    });

    describe('#update', () => {
      it('calls the callback with the changed data', () => {
        subject.update({scaling: {$set: 'memory'}});
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when cursor is refined', () => {
        subject.refine('scaling').update({$set: 'memory'});
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when the cursor is refined at multiple levels', () => {
        subject.refine('cells', 0, 'cell_id').update({$set: 'something'});
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells[0].cell_id).toEqual('something');
      });
    });

    describe('#merge', () => {
      it('updates the cursor', () => {
        subject.merge({foo: 'bar'});
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', cells}));
      });
    });

    describe('#set', () => {
      it('updates the cursor', () => {
        subject.refine('scaling').set('memory');
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });
    });

    describe('#splice', () => {
      it('updates the cursor', () => {
        subject.refine('cells').splice([0, 1]);
        MockPromises.tick();
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#push', () => {
      it('updates the cursor', () => {
        const cell = {cell_id: 'new'};
        subject.refine('cells').push(cell);
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#unshift', () => {
      it('updates the cursor', () => {
        const cell = {cell_id: 'new'};
        subject.refine('cells').unshift(cell);
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#apply', () => {
      it('updates the cursor', () => {
        const newCells = [{cell_id: 'a'}, {cell_id: 'b'}, {cell_id: 'c'}];
        subject.refine('cells').apply(() => newCells);
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({cells: newCells}));
      });
    });

    describe('chaining', () => {
      it('works', () => {
        subject.set({foo: 'bar'}).merge({bar: 'baz'});
        MockPromises.tick();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', bar: 'baz'}));
      });
    });

    describe('#isEqual', () => {
      it('returns true when the cursors are the same', () => {
        const anotherCursor = new Cursor(data, jasmine.createSpy('callback'));
        expect(subject.isEqual(anotherCursor)).toBe(true);
        expect(subject.isEqual(anotherCursor.refine('scaling'))).toBe(false);
      });
    });

    describe('#remove', () => {
      describe('when the cursor points to an array', () => {
        it('updates the cursor when given an object', () => {
          subject.refine('cells').remove(cells[0]);
          MockPromises.tick();
          expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
        });

        it('does not do anything when attempting to remove an array entry that is not there in the first place', () => {
          subject.refine('cells').remove('not in cells');
          MockPromises.tick();
          expect(callbackSpy.calls.mostRecent().args[0].cells).toEqual(cells);
        });

        describe('when the array is empty to begin with', () => {
          it('does not blow up', () => {
            subject.refine('desiredLrps').remove('not in desiredLrps');
            MockPromises.tick();
            expect(callbackSpy.calls.mostRecent().args[0].desiredLrps).toEqual([]);
          });
        });
      });

      describe('when the cursor points to an object', () => {
        it('updates the cursor when given an object', () => {
          subject.refine('rules').remove(1);
          MockPromises.tick();
          expect(callbackSpy).toHaveBeenCalledWith({scaling: 'containers', desiredLrps: [], cells, rules: {}});
        });

        it('does not do anything when attempting to remove a key that is not there in the first place', () => {
          subject.remove('not-here');
          MockPromises.tick();
          expect(callbackSpy).toHaveBeenCalledWith(data);
        })
      });
    });

    describe('#flush', () => {
      it('applies the data and calls the callback immediately', () => {
        subject.set({foo: 'bar'});
        callbackSpy.calls.reset();
        subject.flush();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar'}));
      });
    });

    describe('when more than one operation occurs on a cursor simultaneously', () => {
      describe('when the nextTick is called', () => {
        it('applies the updates in the expected order', () => {
          subject.merge({hi: 5});
          subject.merge({bye: 3});
          MockPromises.tick();
          expect(callbackSpy).toHaveBeenCalled();
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, bye: 3}));
          expect(callbackSpy.calls.count()).toBe(1);
        });
      });

      describe('#refine', () => {
        it('applies all updates in the expected order', () => {
          subject.refine('scaling').set('something else');
          subject.merge({hi: 5});
          MockPromises.tick();
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, scaling: 'something else'}));
          expect(callbackSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'containers'}));
        });
      });

      describe('#push', () => {
        it('applies all updates in the expected order', () => {
          subject.refine('cells').push({cell_id: 100}).push({cell_id: 101});
          MockPromises.tick();
          expect(callbackSpy).toHaveBeenCalled();
          expect(callbackSpy.calls.mostRecent().args[0].cells.map(cell => cell.cell_id)).toEqual([4, 32, 44, 100, 101]);
        });
      });

      describe('#merge', () => {
        it('applies all updates in the expected order', () => {
          subject.merge({hi: 5});
          subject.merge({bye: 3});
          subject.merge({foo: 4});
          MockPromises.tick();
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, bye: 3,foo: 4}));
        });
      });
    });
  });

  describe('with async false', () => {
    beforeEach(() => {
      Cursor.async = false;
    });

    describe('#refine', () => {
      it('returns a new cursor that points to the given path', () => {
        const cursor = subject.refine('scaling');
        expect(cursor).toEqual(jasmine.any(Cursor));
        expect(cursor.get()).toEqual('containers');
      });

      it('can find objects in arrays', () => {
        expect(subject.refine('cells', cells[1]).get()).toBe(cells[1]);
      });

      it('works if the path is a single object', () => {
        expect(subject.refine('cells').refine(cells[1]).get()).toBe(cells[1]);
      });

      it('returns a cursor that updates in the expected way', () => {
        const cell = {cell_id: 'new'};
        subject.refine('cells').refine(cells[1]).set(cell);
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#update', () => {
      it('calls the callback with the changed data', () => {
        subject.update({scaling: {$set: 'memory'}});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when cursor is refined', () => {
        subject.refine('scaling').update({$set: 'memory'});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when the cursor is refined at multiple levels', () => {
        subject.refine('cells', 0, 'cell_id').update({$set: 'something'});
        expect(callbackSpy.calls.mostRecent().args[0].cells[0].cell_id).toEqual('something');
      });
    });

    describe('#merge', () => {
      it('updates the cursor', () => {
        subject.merge({foo: 'bar'});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', cells}));
      });
    });

    describe('#set', () => {
      it('updates the cursor', () => {
        subject.refine('scaling').set('memory');
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });
    });

    describe('#splice', () => {
      it('updates the cursor', () => {
        subject.refine('cells').splice([0, 1]);
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#push', () => {
      it('updates the cursor', () => {
        const cell = {cell_id: 'new'};
        subject.refine('cells').push(cell);
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#unshift', () => {
      it('updates the cursor', () => {
        const cell = {cell_id: 'new'};
        subject.refine('cells').unshift(cell);
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#apply', () => {
      it('updates the cursor', () => {
        const newCells = [{cell_id: 'a'}, {cell_id: 'b'}, {cell_id: 'c'}];
        subject.refine('cells').apply(() => newCells);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({cells: newCells}));
      });
    });

    describe('chaining', () => {
      it('works', () => {
        subject.set({foo: 'bar'}).merge({bar: 'baz'});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', bar: 'baz'}));
      });
    });

    describe('#isEqual', () => {
      it('returns true when the cursors are the same', () => {
        const anotherCursor = new Cursor(data, jasmine.createSpy('callback'));
        expect(subject.isEqual(anotherCursor)).toBe(true);
        expect(subject.isEqual(anotherCursor.refine('scaling'))).toBe(false);
      });
    });

    describe('#remove', () => {
      it('updates the cursor when given an object', () => {
        subject.refine('cells').remove(cells[0]);
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#flush', () => {
      it('does not do anything', () => {
        subject.set({foo: 'bar'});
        callbackSpy.calls.reset();
        subject.flush();
        expect(callbackSpy).not.toHaveBeenCalled();
      });
    });

    describe('when more than one operation occurs on a cursor simultaneously', () => {
      it('applies the updates in the expected order', () => {
        subject.merge({hi: 5});
        subject.merge({bye: 3});
        subject.merge({bye: 4});
        expect(callbackSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({hi: 5, bye: 4}));
      });

      it('does not mutate the data', () => {
        subject.merge({hi: 5});
        subject.merge({bye: 3});
        expect(subject.get()).not.toEqual(jasmine.objectContaining({hi: 5}));
        expect(subject.get()).not.toEqual(jasmine.objectContaining({bye: 3}));
      });

      describe('#refine', () => {
        it('applies all updates in the expected order', () => {
          subject.refine('scaling').set('something else');
          subject.merge({hi: 5});
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, scaling: 'something else'}));
          expect(callbackSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'containers'}));
        });
      });

      describe('#push', () => {
        it('applies all updates in the expected order', () => {
          subject.refine('cells').push({cell_id: 100}).push({cell_id: 101});
          expect(callbackSpy.calls.mostRecent().args[0].cells.map(cell => cell.cell_id)).toEqual([4, 32, 44, 100, 101]);
        });
      });

      describe('#merge', () => {
        it('applies all updates in the expected order', () => {
          subject.merge({hi: 5});
          subject.merge({bye: 3});
          subject.merge({foo: 4});
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, bye: 3,foo: 4}));
        });
      });
    });
  });

  describe('with debug mode false', () => {
    beforeEach(() => {
      Cursor.debug = false;
    });

    describe('with a stale cursor', () => {
      beforeEach(() => {
        Cursor.async = true;
        spyOn(Cursor.prototype, 'nextTick').and.callFake(cb => setTimeout(cb, 0));

        spyOn(console, 'error');
        subject.set({foo: 'bar'});
        MockPromises.tick();
        expect(console.error).not.toHaveBeenCalled();
      });

      it('does not warn users about using it', () => {
        subject.merge({foo: 'baz'});
        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('with debug mode true', () => {
    beforeEach(() => {
      Cursor.debug = true;
    });

    describe('with a stale cursor', () => {
      beforeEach(() => {
        Cursor.async = true;
        spyOn(console, 'error');
        subject.set({foo: 'bar'});
        MockPromises.tick();
        expect(console.error).not.toHaveBeenCalled();
      });

      it('warns users about using it', () => {
        subject.merge({foo: 'baz'});
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});