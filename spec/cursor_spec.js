require('./spec_helper');

describe('Cursor', function() {
  var Cursor, subject, data, cells, callbackSpy;
  beforeEach(function() {
    Cursor = require('../src/cursor');
    cells = [{cell_id: 4}, {cell_id: 32}, {cell_id: 44}];
    data = {scaling: 'containers', cells, desiredLrps: []};
    callbackSpy = jasmine.createSpy('callback');
    subject = new Cursor(data, callbackSpy);
  });

  describe('with async true', function() {
    beforeEach(function() {
      Cursor.async = true;
      spyOn(Cursor.prototype, 'nextTick').and.callFake(cb => setTimeout(cb, 0));
    });

    describe('#get', function() {
      it('returns the data at the specified key', function() {
        expect(subject.get('scaling')).toEqual('containers');
        expect(subject.get('cells', 0)).toEqual(cells[0]);
        expect(subject.get('cells', 0, 'cell_id')).toEqual(cells[0].cell_id);
        expect(subject.get()).toEqual(data);
      });
    });

    describe('#refine', function() {
      it('returns a new cursor that points to the given path', function() {
        var cursor = subject.refine('scaling');
        expect(cursor).toEqual(jasmine.any(Cursor));
        expect(cursor.get()).toEqual('containers');
      });

      it('can find objects in arrays', function() {
        expect(subject.refine('cells', cells[1]).get()).toBe(cells[1]);
      });

      it('works if the path is a single object', function() {
        expect(subject.refine('cells').refine(cells[1]).get()).toBe(cells[1]);
      });

      it('returns a cursor that updates in the expected way', function() {
        var cell = {cell_id: 'new'};
        subject.refine('cells').refine(cells[1]).set(cell);
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#update', function() {
      it('calls the callback with the changed data', function() {
        subject.update({scaling: {$set: 'memory'}});
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when cursor is refined', function() {
        subject.refine('scaling').update({$set: 'memory'});
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when the cursor is refined at multiple levels', function() {
        subject.refine('cells', 0, 'cell_id').update({$set: 'something'});
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells[0].cell_id).toEqual('something');
      });
    });

    describe('#merge', function() {
      it('updates the cursor', function() {
        subject.merge({foo: 'bar'});
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', cells}));
      });
    });

    describe('#set', function() {
      it('updates the cursor', function() {
        subject.refine('scaling').set('memory');
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });
    });

    describe('#splice', function() {
      it('updates the cursor', function() {
        subject.refine('cells').splice([0, 1]);
        jasmine.clock().tick(1);
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#push', function() {
      it('updates the cursor', function() {
        var cell = {cell_id: 'new'};
        subject.refine('cells').push(cell);
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#unshift', function() {
      it('updates the cursor', function() {
        var cell = {cell_id: 'new'};
        subject.refine('cells').unshift(cell);
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#apply', function() {
      it('updates the cursor', function() {
        var newCells = [{cell_id: 'a'}, {cell_id: 'b'}, {cell_id: 'c'}];
        subject.refine('cells').apply(() => newCells);
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({cells: newCells}));
      });
    });

    describe('chaining', function() {
      it('works', function() {
        subject.set({foo: 'bar'}).merge({bar: 'baz'});
        jasmine.clock().tick(1);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', bar: 'baz'}));
      });
    });

    describe('#isEqual', function() {
      it('returns true when the cursors are the same', function() {
        var anotherCursor = new Cursor(data, jasmine.createSpy('callback'));
        expect(subject.isEqual(anotherCursor)).toBe(true);
        expect(subject.isEqual(anotherCursor.refine('scaling'))).toBe(false);
      });
    });

    describe('#remove', function() {
      it('updates the cursor when given an object', function() {
        subject.refine('cells').remove(cells[0]);
        jasmine.clock().tick(1);
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#flush', function() {
      it('applies the data and calls the callback immediately', function() {
        subject.set({foo: 'bar'});
        callbackSpy.calls.reset();
        subject.flush();
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar'}));
      });
    });

    describe('when more than one operation occurs on a cursor simultaneously', function() {
      describe('when the nextTick is called', function() {
        it('applies the updates in the expected order', function() {
          subject.merge({hi: 5});
          subject.merge({bye: 3});
          jasmine.clock().tick(1);
          expect(callbackSpy).toHaveBeenCalled();
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, bye: 3}));
          expect(callbackSpy.calls.count()).toBe(1);
        });
      });

      describe('#refine', function() {
        it('applies all updates in the expected order', function() {
          subject.refine('scaling').set('something else');
          subject.merge({hi: 5});
          jasmine.clock().tick(1);
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, scaling: 'something else'}));
          expect(callbackSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'containers'}));
        });
      });

      describe('#push', function() {
        it('applies all updates in the expected order', function() {
          subject.refine('cells').push({cell_id: 100}).push({cell_id: 101});
          jasmine.clock().tick(1);
          expect(callbackSpy).toHaveBeenCalled();
          expect(callbackSpy.calls.mostRecent().args[0].cells.map(cell => cell.cell_id)).toEqual([4, 32, 44, 100, 101]);
        });
      });

      describe('#merge', function() {
        it('applies all updates in the expected order', function() {
          subject.merge({hi: 5});
          subject.merge({bye: 3});
          subject.merge({foo: 4});
          jasmine.clock().tick(1);
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, bye: 3,foo: 4}));
        });
      });
    });
  });

  describe('with async false', function() {
    beforeEach(function() {
      Cursor.async = false;
    });

    describe('#refine', function() {
      it('returns a new cursor that points to the given path', function() {
        var cursor = subject.refine('scaling');
        expect(cursor).toEqual(jasmine.any(Cursor));
        expect(cursor.get()).toEqual('containers');
      });

      it('can find objects in arrays', function() {
        expect(subject.refine('cells', cells[1]).get()).toBe(cells[1]);
      });

      it('works if the path is a single object', function() {
        expect(subject.refine('cells').refine(cells[1]).get()).toBe(cells[1]);
      });

      it('returns a cursor that updates in the expected way', function() {
        var cell = {cell_id: 'new'};
        subject.refine('cells').refine(cells[1]).set(cell);
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#update', function() {
      it('calls the callback with the changed data', function() {
        subject.update({scaling: {$set: 'memory'}});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when cursor is refined', function() {
        subject.refine('scaling').update({$set: 'memory'});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });

      it('calls the callback when the cursor is refined at multiple levels', function() {
        subject.refine('cells', 0, 'cell_id').update({$set: 'something'});
        expect(callbackSpy.calls.mostRecent().args[0].cells[0].cell_id).toEqual('something');
      });
    });

    describe('#merge', function() {
      it('updates the cursor', function() {
        subject.merge({foo: 'bar'});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', cells}));
      });
    });

    describe('#set', function() {
      it('updates the cursor', function() {
        subject.refine('scaling').set('memory');
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'memory', cells}));
      });
    });

    describe('#splice', function() {
      it('updates the cursor', function() {
        subject.refine('cells').splice([0, 1]);
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#push', function() {
      it('updates the cursor', function() {
        var cell = {cell_id: 'new'};
        subject.refine('cells').push(cell);
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#unshift', function() {
      it('updates the cursor', function() {
        var cell = {cell_id: 'new'};
        subject.refine('cells').unshift(cell);
        expect(callbackSpy.calls.mostRecent().args[0].cells).toContain(cell);
      });
    });

    describe('#apply', function() {
      it('updates the cursor', function() {
        var newCells = [{cell_id: 'a'}, {cell_id: 'b'}, {cell_id: 'c'}];
        subject.refine('cells').apply(() => newCells);
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({cells: newCells}));
      });
    });

    describe('chaining', function() {
      it('works', function() {
        subject.set({foo: 'bar'}).merge({bar: 'baz'});
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({foo: 'bar', bar: 'baz'}));
      });
    });

    describe('#isEqual', function() {
      it('returns true when the cursors are the same', function() {
        var anotherCursor = new Cursor(data, jasmine.createSpy('callback'));
        expect(subject.isEqual(anotherCursor)).toBe(true);
        expect(subject.isEqual(anotherCursor.refine('scaling'))).toBe(false);
      });
    });

    describe('#remove', function() {
      it('updates the cursor when given an object', function() {
        subject.refine('cells').remove(cells[0]);
        expect(callbackSpy.calls.mostRecent().args[0].cells).not.toContain(cells[0]);
      });
    });

    describe('#flush', function() {
      it('does not do anything', function() {
        subject.set({foo: 'bar'});
        callbackSpy.calls.reset();
        subject.flush();
        expect(callbackSpy).not.toHaveBeenCalled();
      });
    });

    describe('when more than one operation occurs on a cursor simultaneously', function() {

      it('applies the updates in the expected order', function() {
        subject.merge({hi: 5});
        subject.merge({bye: 3});
        subject.merge({bye: 4});
        expect(callbackSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({hi: 5, bye: 4}));
      });

      it('does not mutate the data', function() {
        subject.merge({hi: 5});
        subject.merge({bye: 3});
        expect(subject.get()).not.toEqual(jasmine.objectContaining({hi: 5}));
        expect(subject.get()).not.toEqual(jasmine.objectContaining({bye: 3}));
      });

      describe('#refine', function() {
        it('applies all updates in the expected order', function() {
          subject.refine('scaling').set('something else');
          subject.merge({hi: 5});
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, scaling: 'something else'}));
          expect(callbackSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({scaling: 'containers'}));
        });
      });

      describe('#push', function() {
        it('applies all updates in the expected order', function() {
          subject.refine('cells').push({cell_id: 100}).push({cell_id: 101});
          expect(callbackSpy.calls.mostRecent().args[0].cells.map(cell => cell.cell_id)).toEqual([4, 32, 44, 100, 101]);
        });
      });

      describe('#merge', function() {
        it('applies all updates in the expected order', function() {
          subject.merge({hi: 5});
          subject.merge({bye: 3});
          subject.merge({foo: 4});
          expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({hi: 5, bye: 3,foo: 4}));
        });
      });
    });
  });

  describe('with debug mode false', function() {
    beforeEach(function() {
      Cursor.debug = false;
    });

    describe('with a stale cursor', function() {
      beforeEach(function() {
        Cursor.async = true;
        spyOn(Cursor.prototype, 'nextTick').and.callFake(cb => setTimeout(cb, 0));

        spyOn(console, 'warn');
        subject.set({foo: 'bar'});
        jasmine.clock().tick(1);
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('does not warn users about using it', function() {
        subject.merge({foo: 'baz'});
        expect(console.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe('with debug mode true', function() {
    beforeEach(function() {
      Cursor.debug = true;
    });

    describe('with a stale cursor', function() {
      beforeEach(function() {
        Cursor.async = true;
        spyOn(Cursor.prototype, 'nextTick').and.callFake(cb => setTimeout(cb, 0));

        spyOn(console, 'warn');
        subject.set({foo: 'bar'});
        jasmine.clock().tick(1);
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('warns users about using it', function() {
        subject.merge({foo: 'baz'});
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });
});