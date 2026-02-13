export class StateMachine {
  constructor(context) {
    this.states = new Map();
    this.currentState = null;
    this.context = context;
    this.stateHistory = [];
  }

  registerState(name, stateInstance) {
    this.states.set(name, stateInstance);
    stateInstance.stateMachine = this;
    stateInstance.context = this.context;
  }

  changeState(stateName) {
    const nextState = this.states.get(stateName);
    if (!nextState) {
      console.warn(`State "${stateName}" not registered`);
      return;
    }

    // No-op if already in this state
    if (this.currentState === nextState) return;

    if (this.currentState) {
      this.currentState.exit();
      this.stateHistory.push({
        from: this.currentState.name,
        to: stateName,
      });
      if (this.stateHistory.length > 20) this.stateHistory.shift();
    }

    this.currentState = nextState;
    this.currentState.enter();
  }

  update(delta, root) {
    this.currentState?.update(delta, root);
  }

  getCurrentStateName() {
    return this.currentState?.name ?? null;
  }
}
