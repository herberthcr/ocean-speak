export class ECSWorld {
    private entities: Map<number, Entity> = new Map();
    private nextId = 0;
  
    createEntity(): Entity {
      const entity = new Entity(this.nextId++);
      this.entities.set(entity.id, entity);
      return entity;
    }
  
    getEntitiesByComponent(componentName: string): Entity[] {
      return Array.from(this.entities.values()).filter((entity) => entity.hasComponent(componentName));
    }
  }
  
  export class Entity {
    public id: number;
    private components: Map<string, any> = new Map();
    private data: Map<string, any> = new Map();
  
    constructor(id: number) {
      this.id = id;
    }
  
    addComponent<T>(name: string, component: T): this {
      this.components.set(name, component);
      return this;
    }
  
    getComponent<T>(name: string): T | undefined {
      return this.components.get(name);
    }
  
    hasComponent(name: string): boolean {
      return this.components.has(name);
    }
  
    setData(key: string, value: any): void {
      this.data.set(key, value);
    }
  
    getData(key: string): any {
      return this.data.get(key);
    }
  }