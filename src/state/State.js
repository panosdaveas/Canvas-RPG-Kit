export class State {
  constructor(name) {
    this.name = name;
    this.stateMachine = null;
    this.context = null;
    this.blocksController = false;
  }

  enter() {}
  update(delta, root) {}
  exit() {}

  get character() {
    return this.context;
  }

  transitionTo(stateName) {
    this.stateMachine.changeState(stateName);
  }
}
