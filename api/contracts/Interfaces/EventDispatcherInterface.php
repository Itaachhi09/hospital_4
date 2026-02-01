<?php
/**
 * Event Dispatcher Interface
 * Modules publish domain events; other modules or integration layer subscribe.
 * Enables loose coupling and eventual consistency (e.g. Analytics updates on PayrollComputed).
 */

interface EventDispatcherInterface
{
    /**
     * Dispatch a domain event. Payload must be serializable (array/JSON).
     *
     * @param string $eventName e.g. "hrcore.employee.created", "payroll.run.computed"
     * @param array  $payload   Event data (no DB connections or resources)
     */
    public function dispatch($eventName, array $payload);

    /**
     * Subscribe to an event (in-process or queue consumer).
     * Handler signature: function(array $payload): void
     *
     * @param string   $eventName Event name pattern
     * @param callable $handler   Callable that receives payload
     */
    public function subscribe($eventName, callable $handler);
}
