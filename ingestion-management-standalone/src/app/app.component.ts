import { Component, signal } from '@angular/core';
import { IngestionDashboardComponent } from '../../ingestion/components/ingestion-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IngestionDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly showIngestion = signal(false);
}
