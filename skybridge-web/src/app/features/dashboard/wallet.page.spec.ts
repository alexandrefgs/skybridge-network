import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { transactions } from '../../testing/dashboard';
import { pilotAtFlorianopolis } from '../../testing/freelance';
import { WalletPage } from './wallet.page';

describe('WalletPage', () => {
  let fixture: ComponentFixture<WalletPage>;
  let http: HttpTestingController;
  const query = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(WalletPage);
  });

  afterEach(() => http.verify());

  async function load(items = transactions, totalCount = items.length) {
    await fixture.whenStable();
    http.expectOne('/api/pilot').flush({ ...pilotAtFlorianopolis, balance: 4350 });
    http.expectOne(r => r.url === '/api/pilot/transactions' && r.params.get('page') === '1').flush({ items, page: 1, pageSize: 20, totalCount });
    await fixture.whenStable();
  }

  it('shows the balance and every transaction', async () => {
    await load();

    expect(query('balance')!.textContent).toContain('$4,350');
    expect(query('transaction-9')!.textContent).toContain('+$4,500');
    expect(query('transaction-9')!.textContent).toContain('24 Nov 2026 11:40Z');
    expect(query('transaction-8')!.textContent).toContain('−$150');
    expect(query('pager')).toBeNull();
  });

  it('pages through older transactions', async () => {
    await load(transactions, 45);

    query('next-page')!.click();
    await fixture.whenStable();
    http.expectOne(r => r.url === '/api/pilot/transactions' && r.params.get('page') === '2').flush({ items: [], page: 2, pageSize: 20, totalCount: 45 });
    await fixture.whenStable();

    expect(query('pager')!.textContent).toContain('Page 2 of 3');
  });

  it('explains an empty wallet', async () => {
    await load([]);

    expect(query('no-transactions')!.textContent).toContain('first payment');
  });
});