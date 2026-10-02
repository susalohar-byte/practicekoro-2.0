import 'package:flutter/material.dart';

class PKSearchFilterBar extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final String hintText;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onClear;
  final bool showFilter;
  final bool isFilterActive;
  final VoidCallback? onFilterTap;
  final String filterLabel;
  final Color searchIconColor;
  final double height;

  const PKSearchFilterBar({
    super.key,
    required this.controller,
    this.focusNode,
    this.hintText = 'Search test series (e.g. WBP, SSC, TET...)',
    this.onChanged,
    this.onClear,
    this.showFilter = true,
    this.isFilterActive = false,
    this.onFilterTap,
    this.filterLabel = 'Filter',
    this.searchIconColor = const Color(0xFF0877FF),
    this.height = 50.0,
  });

  @override
  State<PKSearchFilterBar> createState() => _PKSearchFilterBarState();
}

class _PKSearchFilterBarState extends State<PKSearchFilterBar> {
  late FocusNode _focusNode;
  bool _internalFocus = false;

  @override
  void initState() {
    super.initState();
    if (widget.focusNode == null) {
      _focusNode = FocusNode();
      _internalFocus = true;
    } else {
      _focusNode = widget.focusNode!;
    }
    _focusNode.addListener(_handleFocusChange);
  }

  void _handleFocusChange() {
    if (mounted) setState(() {});
  }

  @override
  void didUpdateWidget(PKSearchFilterBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      if (_internalFocus) {
        _focusNode.removeListener(_handleFocusChange);
        _focusNode.dispose();
      } else {
        oldWidget.focusNode?.removeListener(_handleFocusChange);
      }
      if (widget.focusNode == null) {
        _focusNode = FocusNode();
        _internalFocus = true;
      } else {
        _focusNode = widget.focusNode!;
        _internalFocus = false;
      }
      _focusNode.addListener(_handleFocusChange);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    if (_internalFocus) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasFocus = _focusNode.hasFocus;
    final hasText = widget.controller.text.isNotEmpty;

    final searchField = Container(
      height: widget.height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(widget.height / 2),
        boxShadow: [
          BoxShadow(
            color: hasFocus
                ? const Color(0xFF0877FF).withValues(alpha: 0.10)
                : const Color(0xFF0B1F5B).withValues(alpha: 0.04),
            blurRadius: hasFocus ? 12 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          inputDecorationTheme: const InputDecorationTheme(
            filled: false,
            fillColor: Colors.transparent,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
        ),
        child: TextField(
          controller: widget.controller,
          focusNode: _focusNode,
          onChanged: (val) {
            widget.onChanged?.call(val);
            setState(() {});
          },
          textAlignVertical: TextAlignVertical.center,
          cursorColor: const Color(0xFF0877FF),
          cursorWidth: 1.8,
          style: const TextStyle(
            fontSize: 14.5,
            color: Color(0xFF0B1F5B),
            fontWeight: FontWeight.w600,
            letterSpacing: -0.1,
          ),
          decoration: InputDecoration(
            hintText: widget.hintText,
            hintStyle: const TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w400,
              letterSpacing: -0.1,
            ),
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 16, right: 10),
              child: Icon(
                Icons.search_rounded,
                color: widget.searchIconColor,
                size: 24,
              ),
            ),
            prefixIconConstraints: BoxConstraints(
              minWidth: 50,
              minHeight: widget.height,
            ),
            suffixIcon: hasText
                ? GestureDetector(
                    onTap: () {
                      widget.controller.clear();
                      widget.onChanged?.call('');
                      widget.onClear?.call();
                      setState(() {});
                    },
                    child: const Padding(
                      padding: EdgeInsets.only(right: 14),
                      child: Icon(
                        Icons.close_rounded,
                        size: 18,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  )
                : null,
            suffixIconConstraints: BoxConstraints(
              minWidth: 40,
              minHeight: widget.height,
            ),
            filled: true,
            fillColor: Colors.white,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(widget.height / 2),
              borderSide: BorderSide(
                color: hasFocus
                    ? const Color(0xFF0877FF)
                    : const Color(0xFFE2ECF8),
                width: hasFocus ? 1.4 : 1.0,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(widget.height / 2),
              borderSide: const BorderSide(
                color: Color(0xFFE2ECF8),
                width: 1.0,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(widget.height / 2),
              borderSide: const BorderSide(
                color: Color(0xFF0877FF),
                width: 1.4,
              ),
            ),
          ),
        ),
      ),
    );

    if (!widget.showFilter) {
      return searchField;
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(child: searchField),
        const SizedBox(width: 12),
        GestureDetector(
          onTap: widget.onFilterTap,
          child: Container(
            height: widget.height,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: widget.isFilterActive
                  ? const Color(0xFFEFF6FF)
                  : Colors.white,
              borderRadius: BorderRadius.circular(widget.height / 2),
              border: Border.all(
                color: widget.isFilterActive
                    ? const Color(0xFF0877FF)
                    : const Color(0xFFE2ECF8),
                width: widget.isFilterActive ? 1.4 : 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0B1F5B).withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.tune_rounded,
                  size: 17,
                  color: widget.isFilterActive
                      ? const Color(0xFF0877FF)
                      : const Color(0xFF0B1F5B),
                ),
                const SizedBox(width: 6),
                Text(
                  widget.filterLabel,
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: widget.isFilterActive
                        ? const Color(0xFF0877FF)
                        : const Color(0xFF0B1F5B),
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  size: 19,
                  color: widget.isFilterActive
                      ? const Color(0xFF0877FF)
                      : const Color(0xFF0B1F5B),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
