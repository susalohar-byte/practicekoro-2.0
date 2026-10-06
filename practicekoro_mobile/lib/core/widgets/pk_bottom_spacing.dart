import 'package:flutter/material.dart';

/// Scope widget to inform descendant widgets whether a floating bottom navigation bar
/// is present in the current view hierarchy and its dimensions.
class PKBottomNavScope extends InheritedWidget {
  /// Whether the floating bottom navigation bar is active.
  final bool hasFloatingNavBar;

  /// Height of the floating pill navigation bar itself (default: 70.0).
  final double navBarHeight;

  /// Bottom margin from the safe-area/screen edge (default: 10.0).
  final double navBarBottomMargin;

  const PKBottomNavScope({
    super.key,
    this.hasFloatingNavBar = true,
    this.navBarHeight = 70.0,
    this.navBarBottomMargin = 10.0,
    required super.child,
  });

  static PKBottomNavScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<PKBottomNavScope>();
  }

  static bool hasNavBar(BuildContext context) {
    return maybeOf(context)?.hasFloatingNavBar ?? false;
  }

  @override
  bool updateShouldNotify(PKBottomNavScope oldWidget) =>
      hasFloatingNavBar != oldWidget.hasFloatingNavBar ||
      navBarHeight != oldWidget.navBarHeight ||
      navBarBottomMargin != oldWidget.navBarBottomMargin;
}

/// Centralized layout spacing utility for bottom navigation clearance across PracticeKoro.
///
/// Ensures that scrollable pages, cards, buttons, and bottom sheets always have sufficient
/// clearance so that the last element can scroll completely above the floating bottom navigation
/// bar without any overlap.
class PKBottomSpacing {
  PKBottomSpacing._();

  /// The standard height of the floating glassmorphic navbar pill.
  static const double floatingBarHeight = 70.0;

  /// The bottom margin applied to the floating navbar above the safe area.
  static const double floatingBarBottomMargin = 10.0;

  /// Total vertical footprint of the floating navbar above safe area (70 + 10 = 80.0).
  static const double totalFloatingBarFootprint =
      floatingBarHeight + floatingBarBottomMargin;

  /// Recommended visual breathing gap between the top of the navbar bubble/pill and the content.
  static const double defaultBreathingGap = 12.0;

  /// Recommended spacing for screens without a floating bar (safe-area + gap).
  static const double defaultDetailGap = 20.0;

  /// Adjustment offset to calibrate visual clearance with the floating navbar (reduced by 50px).
  static const double floatingBarOffset = 50.0;

  /// Keeps the standard gutters useful on compact phones without changing spacing
  /// on normal-width devices or tablets.
  static double responsiveHorizontal(BuildContext context, double preferred) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < 340) return preferred.clamp(8.0, 10.0);
    if (width < 380) return preferred.clamp(10.0, 12.0);
    return preferred;
  }

  /// Calculates the required bottom padding dynamically based on context.
  ///
  /// If inside a [PKBottomNavScope] with an active floating navbar (such as the 5 main tabs),
  /// this returns:
  /// `(totalFloatingBarFootprint + MediaQuery.paddingOf(context).bottom + additionalGap - 50.0)`
  ///
  /// If outside [PKBottomNavScope] (such as standalone detail or settings screens),
  /// this returns:
  /// `MediaQuery.paddingOf(context).bottom + additionalGap`
  static double of(BuildContext context, {double? additionalGap}) {
    final scope = PKBottomNavScope.maybeOf(context);
    // If scope is explicitly defined, use its hasFloatingNavBar flag.
    // If no scope is found, check if we're on a route that uses MainScaffold or assume true for safety.
    final isInsideNavBar = scope != null ? scope.hasFloatingNavBar : true;
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    if (isInsideNavBar) {
      final barHeight = scope?.navBarHeight ?? floatingBarHeight;
      final barMargin = scope?.navBarBottomMargin ?? floatingBarBottomMargin;
      final gap = additionalGap ?? defaultBreathingGap;
      return (barHeight + barMargin + bottomInset + gap - floatingBarOffset)
          .clamp(0.0, double.infinity);
    } else {
      final gap = additionalGap ?? defaultDetailGap;
      return bottomInset + gap;
    }
  }

  /// Calculates the bottom padding specifically for pages with the floating navbar.
  static double floatingBarOf(
    BuildContext context, {
    double additionalGap = defaultBreathingGap,
  }) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return (totalFloatingBarFootprint +
            bottomInset +
            additionalGap -
            floatingBarOffset)
        .clamp(0.0, double.infinity);
  }

  /// Calculates the bottom padding for detail screens without a floating bar.
  static double safeAreaOf(
    BuildContext context, {
    double additionalGap = defaultDetailGap,
  }) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return bottomInset + additionalGap;
  }

  /// Returns [EdgeInsets] with dynamically calculated bottom clearance.
  static EdgeInsets edgeInsets(
    BuildContext context, {
    double horizontal = 16.0,
    double top = 12.0,
    double? additionalGap,
  }) {
    return EdgeInsets.fromLTRB(
      responsiveHorizontal(context, horizontal),
      top,
      responsiveHorizontal(context, horizontal),
      of(context, additionalGap: additionalGap),
    );
  }

  /// Returns [EdgeInsets] specifically with floating bar clearance.
  static EdgeInsets floatingBarEdgeInsets(
    BuildContext context, {
    double horizontal = 16.0,
    double top = 12.0,
    double additionalGap = defaultBreathingGap,
  }) {
    return EdgeInsets.fromLTRB(
      responsiveHorizontal(context, horizontal),
      top,
      horizontal,
      floatingBarOf(context, additionalGap: additionalGap),
    );
  }

  /// Returns [EdgeInsets] for detail screens without floating bar.
  static EdgeInsets safeAreaEdgeInsets(
    BuildContext context, {
    double horizontal = 16.0,
    double top = 12.0,
    double additionalGap = defaultDetailGap,
  }) {
    return EdgeInsets.fromLTRB(
      horizontal,
      top,
      horizontal,
      safeAreaOf(context, additionalGap: additionalGap),
    );
  }
}

/// A spacer widget that automatically expands to the exact bottom clearance height.
/// Useful as the trailing item in a [Column], [ListView], or modal.
class PKBottomNavSpacer extends StatelessWidget {
  final double? additionalGap;

  const PKBottomNavSpacer({super.key, this.additionalGap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PKBottomSpacing.of(context, additionalGap: additionalGap),
    );
  }
}

/// A sliver spacer widget for [CustomScrollView].
class PKBottomNavSliverSpacer extends StatelessWidget {
  final double? additionalGap;

  const PKBottomNavSliverSpacer({super.key, this.additionalGap});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: PKBottomSpacing.of(context, additionalGap: additionalGap),
      ),
    );
  }
}

/// Extension on [BuildContext] for quick access to bottom navigation clearance.
extension PKBottomSpacingExtension on BuildContext {
  /// Bottom spacing clearance for floating navbar and safe area.
  double get bottomNavPadding => PKBottomSpacing.of(this);

  /// Standard EdgeInsets with bottom navbar clearance.
  EdgeInsets bottomNavEdgeInsets({
    double horizontal = 16.0,
    double top = 12.0,
    double? additionalGap,
  }) => PKBottomSpacing.edgeInsets(
    this,
    horizontal: horizontal,
    top: top,
    additionalGap: additionalGap,
  );

  /// Whether a floating bottom navbar is active in current context.
  bool get hasBottomNav => PKBottomNavScope.hasNavBar(this);
}
