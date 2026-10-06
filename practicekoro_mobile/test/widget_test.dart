import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:practicekoro_mobile/main.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:practicekoro_mobile/data/datasources/local_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('PracticeKoroApp initializes and navigates smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorageService.init();

    await tester.pumpWidget(
      const ProviderScope(
        child: PracticeKoroApp(),
      ),
    );

    // Initial frame renders Splash Screen with PracticeKoro branding
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('PracticeKoro'), findsOneWidget);

    // Advance past splash screen timer to onboarding
    await tester.pump(const Duration(milliseconds: 3000));
    await tester.pumpAndSettle();

    // Verify Onboarding Screen renders action buttons
    expect(find.text('চালু করি'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });
}
