import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../constants/exam_assets.dart';

class ImageUrlHelper {
  /// Resolves image URLs saved by Admin Panel (relative paths, Supabase storage, or web URLs).
  static String? resolveAdminImageUrl(String? rawUrl) {
    if (rawUrl == null) return null;
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) return null;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('//')) {
      return 'https:$trimmed';
    }
    if (trimmed.startsWith('assets/')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return '${AppConstants.websiteUrl}$trimmed';
    }
    if (trimmed.startsWith('images/') || trimmed.startsWith('popular-') || trimmed.startsWith('banners/')) {
      return '${AppConstants.websiteUrl}/$trimmed';
    }
    return trimmed;
  }

  /// Returns true if the string points to a bundled Flutter asset.
  static bool isAsset(String? path) {
    if (path == null) return false;
    return path.trim().startsWith('assets/');
  }

  /// Maps Admin Panel banner theme colors to matching high-contrast gradients.
  static List<Color> getThemeGradient(String? theme) {
    switch (theme?.toLowerCase()) {
      case 'purple':
        return const [
          Color(0xFF2E1065),
          Color(0xFF4C1D95),
          Color(0xFF7C3AED),
        ];
      case 'amber':
      case 'orange':
        return const [
          Color(0xFF78350F),
          Color(0xFFB45309),
          Color(0xFFF59E0B),
        ];
      case 'emerald':
      case 'green':
        return const [
          Color(0xFF064E3B),
          Color(0xFF047857),
          Color(0xFF10B981),
        ];
      case 'rose':
      case 'pink':
        return const [
          Color(0xFF881337),
          Color(0xFFBE123C),
          Color(0xFFF43F5E),
        ];
      case 'navy':
      case 'slate':
        return const [
          Color(0xFF0A192F),
          Color(0xFF1E293B),
          Color(0xFF334155),
        ];
      case 'blue':
      default:
        return const [
          Color(0xFF051E4E),
          Color(0xFF0A3686),
          Color(0xFF026BFC),
        ];
    }
  }
}

/// A bulletproof widget to display images from Admin Panel, assets, or fallback exam emblems.
class PkAdminImage extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final String? fallbackExamTitle;
  final IconData fallbackIcon;
  final Color? fallbackColor;
  final Color? backgroundColor;

  const PkAdminImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.fallbackExamTitle,
    this.fallbackIcon = Icons.school_rounded,
    this.fallbackColor,
    this.backgroundColor,
  });

  Widget _buildFallback() {
    if (fallbackExamTitle != null) {
      final emblem = ExamAssets.getEmblemAsset(fallbackExamTitle!);
      if (emblem != null) {
        return Padding(
          padding: const EdgeInsets.all(4),
          child: Image.asset(
            emblem,
            width: width,
            height: height,
            fit: BoxFit.contain,
          ),
        );
      }
    }
    return Center(
      child: Icon(
        fallbackIcon,
        color: fallbackColor ?? const Color(0xFF026BFC),
        size: (width != null && height != null)
            ? (width! < height! ? width! * 0.5 : height! * 0.5)
            : 24,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final resolved = ImageUrlHelper.resolveAdminImageUrl(imageUrl);

    Widget imageWidget;
    if (resolved == null) {
      imageWidget = _buildFallback();
    } else if (ImageUrlHelper.isAsset(resolved)) {
      imageWidget = Image.asset(
        resolved,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, _, _) => _buildFallback(),
      );
    } else {
      imageWidget = Image.network(
        resolved,
        width: width,
        height: height,
        fit: fit,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: width,
            height: height,
            color: backgroundColor ?? const Color(0xFFF1F5F9),
            child: const Center(
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF026BFC),
                ),
              ),
            ),
          );
        },
        errorBuilder: (_, _, _) => _buildFallback(),
      );
    }

    if (borderRadius != null) {
      imageWidget = ClipRRect(
        borderRadius: borderRadius!,
        child: imageWidget,
      );
    }

    if (backgroundColor != null) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: borderRadius,
        ),
        child: imageWidget,
      );
    }

    return imageWidget;
  }
}
