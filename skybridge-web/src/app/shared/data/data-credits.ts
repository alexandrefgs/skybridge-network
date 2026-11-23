import { Component } from '@angular/core';

@Component({
  selector: 'sb-data-credits',
  template: `
    <p class="mt-6 text-xs text-muted" data-testid="data-credits">
      Airline and route data from
      <a href="https://openflights.org/data" target="_blank" rel="noopener" class="underline hover:text-primary">OpenFlights</a>,
      under the
      <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener" class="underline hover:text-primary">Open Database License (ODbL)</a>.
      Brazilian routes from the CGNA repetitive flight plans (RPL).
    </p>
  `
})
export class DataCredits {}