export function buildServiceLogEntry(order, form, service, entry) {
  return {
    service_order_id: order.service_order_id,
    service_id: service.service_id,
    service_date: order.service_date || form.service_date,
    service_miles: order.mileage_at_service ?? form.mileage_at_service,
    name: service.name,
    notes: entry.notes,
    parts: entry.parts,
    labor: entry.labor,
    total_cost: Number(entry.total) || 0,
    use_total_cost: true,
  }
}
