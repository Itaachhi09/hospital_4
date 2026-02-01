<?php
/**
 * Payroll Run Data Transfer Object
 * Used when Analytics or Integration consumes payroll data. Payroll module returns this.
 */

final class PayrollRunDTO
{
    public string $id;
    public string $period;
    public ?string $periodStartDate;
    public ?string $periodEndDate;
    public ?string $paymentDate;
    public string $status;
    public ?int $totalEmployees;
    public ?float $grossSalary;
    public ?float $deductions;
    public ?float $netSalary;
    public ?string $processedDate;

    public function __construct(array $data)
    {
        $this->id = (string)($data['id'] ?? '');
        $this->period = (string)($data['period'] ?? '');
        $this->periodStartDate = isset($data['period_start_date']) ? (string)$data['period_start_date'] : null;
        $this->periodEndDate = isset($data['period_end_date']) ? (string)$data['period_end_date'] : null;
        $this->paymentDate = isset($data['payment_date']) ? (string)$data['payment_date'] : null;
        $this->status = (string)($data['status'] ?? 'draft');
        $this->totalEmployees = isset($data['total_employees']) ? (int)$data['total_employees'] : null;
        $this->grossSalary = isset($data['gross_salary']) ? (float)$data['gross_salary'] : null;
        $this->deductions = isset($data['deductions']) ? (float)$data['deductions'] : null;
        $this->netSalary = isset($data['net_salary']) ? (float)$data['net_salary'] : null;
        $this->processedDate = isset($data['processed_date']) ? (string)$data['processed_date'] : null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'period' => $this->period,
            'period_start_date' => $this->periodStartDate,
            'period_end_date' => $this->periodEndDate,
            'payment_date' => $this->paymentDate,
            'status' => $this->status,
            'total_employees' => $this->totalEmployees,
            'gross_salary' => $this->grossSalary,
            'deductions' => $this->deductions,
            'net_salary' => $this->netSalary,
            'processed_date' => $this->processedDate,
        ];
    }
}
