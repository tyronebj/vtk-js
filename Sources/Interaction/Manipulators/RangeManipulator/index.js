import macro from 'vtk.js/Sources/macro';
import vtkMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseManipulator';

// ----------------------------------------------------------------------------
// vtkRangeManipulator methods
// ----------------------------------------------------------------------------

function vtkRangeManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRangeManipulator');

  //-------------------------------------------------------------------------
  function processDelta(listener, delta) {
    let normDelta = delta;
    normDelta *= (listener.max - listener.min) / listener.step + 1;
    let value = listener.getValue() + normDelta;

    const difference = value - listener.min;
    const stepsToDifference = Math.round(difference / listener.step);
    value = listener.min + listener.step * stepsToDifference;
    value = Math.max(value, listener.min);
    value = Math.min(value, listener.max);

    listener.setValue(value);
  }

  //-------------------------------------------------------------------------
  publicAPI.setHorizontalListener = (min, max, step, getValue, setValue) => {
    const getFn = Number.isFinite(getValue) ? () => getValue : getValue;
    model.horizontalListener = { min, max, step, getValue: getFn, setValue };
    publicAPI.modified();
  };

  //-------------------------------------------------------------------------
  publicAPI.setVerticalListener = (min, max, step, getValue, setValue) => {
    const getFn = Number.isFinite(getValue) ? () => getValue : getValue;
    model.verticalListener = { min, max, step, getValue: getFn, setValue };
    publicAPI.modified();
  };

  //-------------------------------------------------------------------------
  publicAPI.setScrollListener = (min, max, step, getValue, setValue) => {
    const getFn = Number.isFinite(getValue) ? () => getValue : getValue;
    model.scrollListener = { min, max, step, getValue: getFn, setValue };
    publicAPI.modified();
  };

  //-------------------------------------------------------------------------
  publicAPI.removeHorizontalListener = () => {
    if (model.verticalListener) {
      delete model.verticalListener;
      publicAPI.modified();
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.removeVerticalListener = () => {
    if (model.horizontalListener) {
      delete model.horizontalListener;
      publicAPI.modified();
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.removeScrollListener = () => {
    if (model.scrollListener) {
      delete model.scrollListener;
      publicAPI.modified();
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAllListeners = () => {
    publicAPI.removeHorizontalListener();
    publicAPI.removeVerticalListener();
    publicAPI.removesCrollListener();
  };

  //-------------------------------------------------------------------------
  publicAPI.onAnimation = (interactor, renderer) => {
    if (!model.verticalListener && !model.horizontalListener) {
      return;
    }

    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);
    const lastPos = interactor.getLastAnimationEventPosition(lastPtr);

    if (!pos || !lastPos || !renderer) {
      return;
    }

    // Scale by viewport size
    const size = interactor.getView().getViewportSize(renderer);

    if (model.horizontalListener) {
      const dx = (pos.x - lastPos.x) / size[0];
      processDelta(model.horizontalListener, dx);
    }
    if (model.verticalListener) {
      const dy = (pos.y - lastPos.y) / size[1];
      processDelta(model.verticalListener, dy);
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.onPinch = (interactor) => {
    if (!model.scrollListener) {
      return;
    }

    const interactorStyle = interactor.getInteractorStyle();
    let renderer = interactorStyle.getCurrentRenderer();

    if (!renderer) {
      const pos = interactor.getAnimationEventPosition(
        interactor.getPointerIndex()
      );
      renderer = interactor.findPokedRenderer(pos);
      if (!renderer) {
        return;
      }
    }

    const scale = interactor.getScale();
    const lastScale = interactor.getLastScale();
    const delta = 1.0 - scale / lastScale;
    processDelta(model.scrollListener, delta);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  horizontalListener: null,
  verticalListener: null,
  scrollListener: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMouseManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkRangeManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRangeManipulator');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
