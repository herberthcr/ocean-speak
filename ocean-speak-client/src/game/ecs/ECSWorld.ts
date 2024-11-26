import { System } from '../systems/System';

export class ECSWorld {

  private entities: Map<number, Map<string, any>> = new Map();
  private systems: Array<System> = [];
  private entityIdCounter = 0;

  createEntity(): number {
    const id = this.entityIdCounter++;
    this.entities.set(id, new Map());
    return id;
  }

  deleteEntity(entityId: number): void {
    this.entities.delete(entityId);
  }

  addComponent(entityId: number, name: string, component: any): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.set(name, component);
    }
  }

  getComponent(entityId: number, name: string): any | undefined {
    return this.entities.get(entityId)?.get(name);
  }

  queryEntities(componentNames: string[]): number[] {
    const results: number[] = [];
    for (const [id, components] of this.entities.entries()) {
      if (componentNames.every(name => components.has(name))) {
        results.push(id);
      }
    }
    return results;
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  update(delta: number): void {
    for (const system of this.systems) {
      system.update(delta);
    }
  }
}