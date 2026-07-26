(function ($) {
    "use strict";
    /*========== Color Math ==========*/
    function Color(r, g, b) {
        this.r = clamp(r);
        this.g = clamp(g);
        this.b = clamp(b);
    }
    function clamp(v) {
        return v > 255 ? 255 : v < 0 ? 0 : v;
    }
    Color.prototype.set = function (r, g, b) {
        this.r = clamp(r);
        this.g = clamp(g);
        this.b = clamp(b);
    };
    Color.prototype.multiply = function (m) {
        var r = clamp(this.r * m[0] + this.g * m[1] + this.b * m[2]);
        var g = clamp(this.r * m[3] + this.g * m[4] + this.b * m[5]);
        var b = clamp(this.r * m[6] + this.g * m[7] + this.b * m[8]);
        this.r = r;
        this.g = g;
        this.b = b;
    };
    Color.prototype.hueRotate = function (angle) {
        angle = (angle / 180) * Math.PI;
        var s = Math.sin(angle),
            c = Math.cos(angle);
        this.multiply([
            0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
            0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
            0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072
        ]);
    };
    Color.prototype.sepia = function (v) {
        if (v === undefined) v = 1;
        this.multiply([
            0.393 + 0.607 * (1 - v), 0.769 - 0.769 * (1 - v), 0.189 - 0.189 * (1 - v),
            0.349 - 0.349 * (1 - v), 0.686 + 0.314 * (1 - v), 0.168 - 0.168 * (1 - v),
            0.272 - 0.272 * (1 - v), 0.534 - 0.534 * (1 - v), 0.131 + 0.869 * (1 - v)
        ]);
    };
    Color.prototype.saturate = function (v) {
        if (v === undefined) v = 1;
        this.multiply([
            0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v,
            0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v,
            0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v
        ]);
    };
    Color.prototype.linear = function (slope, intercept) {
        if (slope === undefined) slope = 1;
        if (intercept === undefined) intercept = 0;
        this.r = clamp(this.r * slope + intercept * 255);
        this.g = clamp(this.g * slope + intercept * 255);
        this.b = clamp(this.b * slope + intercept * 255);
    };
    Color.prototype.brightness = function (v) {
        if (v === undefined) v = 1;
        this.linear(v);
    };
    Color.prototype.contrast = function (v) {
        if (v === undefined) v = 1;
        this.linear(v, -(0.5 * v) + 0.5);
    };
    Color.prototype.invert = function (v) {
        if (v === undefined) v = 1;
        this.r = clamp((v + (this.r / 255) * (1 - 2 * v)) * 255);
        this.g = clamp((v + (this.g / 255) * (1 - 2 * v)) * 255);
        this.b = clamp((v + (this.b / 255) * (1 - 2 * v)) * 255);
    };
    Color.prototype.hsl = function () {
        var r = this.r / 255,
            g = this.g / 255,
            b = this.b / 255;
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h = 0,
            s = 0,
            l = (max + min) / 2;
        if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    };
    /*========== CSS Filter Solver ==========*/
    function Solver(target) {
        this.target = target;
        this.targetHSL = target.hsl();
        this.reused = new Color(0, 0, 0);
    }
    Solver.prototype.solve = function () {
        var r = this.solveNarrow(this.solveWide());
        return { values: r.values, loss: r.loss, filter: this.css(r.values) };
    };
    Solver.prototype.solveWide = function () {
        var A = 5,
            c = 15,
            a = [60, 180, 18000, 600, 1.2, 1.2];
        var best = { loss: Infinity };
        for (var i = 0; best.loss > 25 && i < 3; i++) {
            var init = [50, 20, 3750, 50, 100, 100];
            var res = this.spsa(A, a, c, init, 1000);
            if (res.loss < best.loss) best = res;
        }
        return best;
    };
    Solver.prototype.solveNarrow = function (wide) {
        var A = wide.loss,
            c = 2,
            A1 = A + 1;
        var a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
        return this.spsa(A, a, c, wide.values, 500);
    };
    Solver.prototype.spsa = function (A, a, c, values, iters) {
        var alpha = 1,
            gamma = 0.16666666666666666;
        var best = null,
            bestLoss = Infinity;
        var deltas = [0, 0, 0, 0, 0, 0],
            high = [0, 0, 0, 0, 0, 0],
            low = [0, 0, 0, 0, 0, 0];
        for (var k = 0; k < iters; k++) {
            var ck = c / Math.pow(k + 1, gamma);
            for (var i = 0; i < 6; i++) {
                deltas[i] = Math.random() > 0.5 ? 1 : -1;
                high[i] = values[i] + ck * deltas[i];
                low[i] = values[i] - ck * deltas[i];
            }
            var diff = this.loss(high) - this.loss(low);
            for (var j = 0; j < 6; j++) {
                var g = (diff / (2 * ck)) * deltas[j];
                var ak = a[j] / Math.pow(A + k + 1, alpha);
                values[j] = fix(values[j] - ak * g, j);
            }
            var loss = this.loss(values);
            if (loss < bestLoss) {
                best = values.slice(0);
                bestLoss = loss;
            }
        }
        function fix(value, idx) {
            var max = 100;
            if (idx === 2) max = 7500;
            else if (idx === 4 || idx === 5) max = 200;
            if (idx === 3) {
                if (value > max) value %= max;
                else if (value < 0) value = max + (value % max);
            } else if (value < 0) value = 0;
            else if (value > max) value = max;
            return value;
        }
        return { values: best, loss: bestLoss };
    };
    Solver.prototype.loss = function (f) {
        var col = this.reused;
        col.set(0, 0, 0);
        col.invert(f[0] / 100);
        col.sepia(f[1] / 100);
        col.saturate(f[2] / 100);
        col.hueRotate(f[3] * 3.6);
        col.brightness(f[4] / 100);
        col.contrast(f[5] / 100);
        var h = col.hsl();
        return (
            Math.abs(col.r - this.target.r) +
            Math.abs(col.g - this.target.g) +
            Math.abs(col.b - this.target.b) +
            Math.abs(h.h - this.targetHSL.h) +
            Math.abs(h.s - this.targetHSL.s) +
            Math.abs(h.l - this.targetHSL.l)
        );
    };
    Solver.prototype.css = function (f) {
        function fmt(idx, mul) {
            return Math.round(f[idx] * (mul || 1));
        }
        return (
            "filter: invert(" + fmt(0) + "%) sepia(" + fmt(1) + "%) saturate(" + fmt(2) +
            "%) hue-rotate(" + fmt(3, 3.6) + "deg) brightness(" + fmt(4) + "%) contrast(" + fmt(5) + "%);"
        );
    };
    /*========== Color Conversion Helpers ==========*/
    function hexToRgb(hex) {
        if (!hex) return null;
        hex = hex.trim().replace(/^#/, "");
        if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    function rgbToHex(r, g, b) {
        var h = function (n) {
            var s = Math.round(n).toString(16);
            return s.length < 2 ? "0" + s : s;
        };
        return "#" + (h(r) + h(g) + h(b)).toUpperCase();
    }
    function applyToBlack(values) {
        function r(i, mul) {
            return Math.round(values[i] * (mul || 1));
        }
        var c = new Color(0, 0, 0);
        c.invert(r(0) / 100);
        c.sepia(r(1) / 100);
        c.saturate(r(2) / 100);
        c.hueRotate(r(3, 3.6));
        c.brightness(r(4) / 100);
        c.contrast(r(5) / 100);
        return { r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) };
    }
    /*========== Main Compute Filter Function ==========*/
    function computeFilter(hex) {
        var rgb = hexToRgb(hex);
        if (!rgb) return null;
        var value, loss = 0, approx = { r: rgb[0], g: rgb[1], b: rgb[2] };
        if (rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0) {
            value = "brightness(0%)";
        } else if (rgb[0] === 255 && rgb[1] === 255 && rgb[2] === 255) {
            value = "invert(100%)";
        } else {
            var target = new Color(rgb[0], rgb[1], rgb[2]);
            var solver = new Solver(target);
            var res = solver.solve();
            loss = res.loss;
            value = res.filter.replace(/^filter:\s*/, "").replace(/;$/, "");
            approx = applyToBlack(res.values);
        }
        var delta = Math.abs(rgb[0] - approx.r) + Math.abs(rgb[1] - approx.g) + Math.abs(rgb[2] - approx.b);
        var percent = Math.max(0, Math.min(100, Math.round((1 - delta / 765) * 100)));
        var hsl = new Color(rgb[0], rgb[1], rgb[2]).hsl();
        return {
            filter: "filter: " + value + ";",
            value: value,
            loss: loss,
            rgb: rgb,
            hsl: hsl,
            approx: approx,
            approxHex: rgbToHex(approx.r, approx.g, approx.b),
            percent: percent
        };
    }
    /*========== DOM References ==========*/
    var $hexText = $("#hexText"),
        $hexWrap = $(".hex-input"),
        $errMsg = $(".err-msg"),
        $colorPick = $("#colorPick"),
        $targetSw = $(".sw.target"),
        $filtered = $(".blk"),
        $iconF = $(".ic.f svg"),
        $pre = $("#codeRule"),
        $matchFill = $(".match-fill"),
        $matchPct = $(".match-pct"),
        $rgbOut = $("#outRgb"),
        $hslOut = $("#outHsl"),
        $approxOut = $("#outApprox"),
        $previewGrid = $(".preview-grid");
    var lastGood = null,
        raf = 0;
    /*========== UI Animations & Syntax Highlighting ==========*/
    function pulse() {
        $previewGrid.removeClass("pulse");
        void $previewGrid[0].offsetWidth; // reflow to restart animation
        $previewGrid.addClass("pulse");
    }
    function highlight(rule) {
        var idx = rule.indexOf(":");
        var prop = rule.slice(0, idx);
        var val = rule.slice(idx + 1).replace(/;$/, "");
        return '<span class="k">' + prop + '</span>: <span class="v">' + val.trim() + '</span>;';
    }
    /*========== Main UI Update Logic ==========*/
    function update() {
        var raw = $hexText.val();
        var rgb = hexToRgb(raw);
        if (!rgb) {
            $hexWrap.addClass("error");
            $errMsg.text("Enter a valid hex like #EC2FA0 or #F3C");
            return;
        }
        $hexWrap.removeClass("error");
        $errMsg.text("");
        var norm = rgbToHex(rgb[0], rgb[1], rgb[2]);
        if ($colorPick.val().toUpperCase() !== norm) $colorPick.val(norm);
        var res = computeFilter(norm);
        lastGood = res;
        // Previews
        $targetSw.css("background", norm);
        $filtered.css("filter", res.value);
        $iconF.css("filter", res.value);
        // Code output
        $pre.html(highlight(res.filter));
        // Readouts
        $rgbOut.text(res.rgb.join(", "));
        $hslOut.text(Math.round(res.hsl.h) + "°, " + Math.round(res.hsl.s) + "%, " + Math.round(res.hsl.l) + "%");
        $approxOut.text(res.approxHex + (res.approxHex === norm ? " ✓" : ""));
        // Match meter
        $matchFill.css("width", res.percent + "%");
        $matchPct.text(res.percent + "%");
        // Preset active state
        $(".swatch").each(function () {
            var matches = ($(this).data("hex") || "").toUpperCase() === norm;
            $(this).toggleClass("active", matches);
        });
        pulse();
    }
    function schedule() {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
    }
    /*========== Event Handlers ==========*/
    $hexText.on("input", schedule);
    $hexText.on("blur", function () {
        var rgb = hexToRgb($hexText.val());
        if (rgb) $hexText.val(rgbToHex(rgb[0], rgb[1], rgb[2]).replace("#", ""));
    });
    $colorPick.on("input", function () {
        $hexText.val($(this).val().replace("#", "").toUpperCase());
        schedule();
    });
    // Swatch Presets
    $(".swatch").on("click", function () {
        $hexText.val(($(this).data("hex") || "").replace("#", "").toUpperCase());
        schedule();
    });
    /*========== Copy to Clipboard Logic ==========*/
    function copyText(text, $btn) {
        var done = function () {
            var orig = $btn.data("label") || $btn.text();
            $btn.data("label", orig);
            $btn.addClass("ok").html('<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg> Copied');
            $("#copyLive").text("Copied to clipboard");
            setTimeout(function () {
                $btn.removeClass("ok").text(orig);
            }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(function () {
                fallback(text);
                done();
            });
        } else {
            fallback(text);
            done();
        }
    }
    function fallback(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
        } catch (e) {}
        document.body.removeChild(ta);
    }
    $("#copyValue").on("click", function () {
        if (lastGood) copyText(lastGood.value, $(this));
    });
    $("#copyRule").on("click", function () {
        if (lastGood) copyText(lastGood.filter, $(this));
    });
    /*========== Dark Section Snippets & Controls ==========*/
    var darkSnippets = {
        svg: function (f) {
            return '<span class="c">/* recolor a black inline SVG or &lt;img&gt; */</span>\n' +
                '<span class="t">.icon</span>, <span class="t">img.icon-black</span> {\n  ' +
                '<span class="k">filter</span>: <span class="v">' + f + '</span>;\n}';
        },
        font: function (f) {
            return '<span class="c">/* font / glyph icons (render them black first) */</span>\n' +
                '<span class="t">.fa-heart</span>, <span class="t">.star</span> {\n  ' +
                '<span class="k">color</span>: <span class="v">#000</span>;\n  ' +
                '<span class="k">filter</span>: <span class="v">' + f + '</span>;\n}';
        },
        png: function (f) {
            return '<span class="c">/* black PNG logo → any brand colour */</span>\n' +
                '<span class="t">img.logo</span> {\n  ' +
                '<span class="k">filter</span>: <span class="v">' + f + '</span>;\n}';
        },
        shape: function (f) {
            return '<span class="c">/* any solid-black CSS element */</span>\n' +
                '<span class="t">.badge-dot</span> {\n  ' +
                '<span class="k">background</span>: <span class="v">#000</span>;\n  ' +
                '<span class="k">filter</span>: <span class="v">' + f + '</span>;\n}';
        }
    };
    var darkTab = "svg",
        darkHex = "#EC2FA0";
    function renderDark() {
        var res = computeFilter(darkHex);
        var f = res ? res.value : "none";
        $(".dark-code").html(darkSnippets[darkTab](f));
        $(".demo-star svg").css("filter", f);
    }
    $(".tab").on("click", function () {
        $(".tab").removeClass("active");
        $(this).addClass("active");
        darkTab = $(this).data("tab");
        renderDark();
    });
    $(".try-sw").on("click", function () {
        $(".try-sw").removeClass("active");
        $(this).addClass("active");
        darkHex = $(this).data("hex");
        renderDark();
    });

    /*========== Accordion FAQ Logic ==========*/
    $(".faq-q").on("click", function () {
        var $item = $(this).closest(".faq");
        var isOpen = $item.hasClass("open");
        $(".faq").not($item).removeClass("open").find(".faq-a").slideUp(260);
        $(".faq").not($item).find(".faq-q").attr("aria-expanded", "false");
        if (isOpen) {
            $item.removeClass("open");
            $item.find(".faq-a").slideUp(260);
            $(this).attr("aria-expanded", "false");
        } else {
            $item.addClass("open");
            $item.find(".faq-a").slideDown(300);
            $(this).attr("aria-expanded", "true");
        }
    });

    /*========== Navigation & Smooth Scrolling ==========*/
    var $nav = $(".nav");

    function onScroll() {
        $nav.toggleClass("scrolled", $(window).scrollTop() > 8);
    }

    $(window).on("scroll", onScroll);
    onScroll();

    $(".nav-toggle").on("click", function () {
        $(".nav-links").toggleClass("open");
    });

    $('a[href^="#"]').on("click", function (e) {
        var href = $(this).attr("href");
        if (href === "#" || href.length < 2) return;
        var $t = $(href);
        if (!$t.length) return;
        e.preventDefault();
        $(".nav-links").removeClass("open");
        var top = $t.offset().top - ($nav.outerHeight() + 14);
        $("html, body").animate({ scrollTop: top }, 620, "swing");
    });

    /*========== Scroll Reveal Animations ==========*/
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) {
                        $(en.target).addClass("in");
                        io.unobserve(en.target);
                    }
                });
            },
            { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
        );
        $("[data-reveal], .dark, .cta").each(function () {
            io.observe(this);
        });
    } else {
        $("[data-reveal], .dark, .cta").addClass("in");
    }

    /*========== Initial Execution ==========*/
    $hexText.val("EC2FA0");
    update();
    renderDark();

})(jQuery);









