import math
import os
import sys

OUT = sys.argv[1]
INK = "#1E1646"


def spark(x, y, s, c="#fff", op=0.35):
    return (f'<path d="M{x} {y-s} Q{x} {y} {x+s} {y} Q{x} {y} {x} {y+s} Q{x} {y} {x-s} {y} Q{x} {y} {x} {y-s} Z" '
            f'fill="{c}" opacity="{op}"/>')


def wrap(bg, body):
    deco = spark(34, 66, 9) + spark(208, 56, 7) + f'<circle cx="214" cy="160" r="4" fill="#fff" opacity=".3"/>'
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">'
            '<defs><clipPath id="c"><circle cx="120" cy="120" r="120"/></clipPath></defs>'
            f'<circle cx="120" cy="120" r="120" fill="{bg}"/>'
            f'<g clip-path="url(#c)">{deco}{body}</g></svg>')


def eyes(y, gap=24, cx=120, rx=9, ry=None, c=INK):
    ry = ry or round(rx * 1.2, 1)
    s = ''
    for x in (cx - gap, cx + gap):
        s += (f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}"/>'
              f'<circle cx="{x + rx * 0.35:.1f}" cy="{y - ry * 0.4:.1f}" r="{rx * 0.38:.1f}" fill="#fff"/>')
    return s


def smile(y, w=9, cx=120, sw=4.5):
    return (f'<path d="M{cx-w} {y} Q{cx} {y+w} {cx+w} {y}" fill="none" stroke="{INK}" '
            f'stroke-width="{sw}" stroke-linecap="round"/>')


def open_mouth(y, w=11, cx=120):
    return (f'<path d="M{cx-w} {y} Q{cx} {y+2*w} {cx+w} {y} Z" fill="{INK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
            f'<path d="M{cx-0.5*w:.1f} {y+0.75*w:.1f} Q{cx} {y+0.45*w:.1f} {cx+0.5*w:.1f} {y+0.75*w:.1f} '
            f'Q{cx} {y+1.25*w:.1f} {cx-0.5*w:.1f} {y+0.75*w:.1f} Z" fill="#FF7A9A"/>')


def blush(y, gap=42, cx=120, c="#FF7FA8", op=0.55):
    return ''.join(f'<ellipse cx="{x}" cy="{y}" rx="10" ry="6" fill="{c}" opacity="{op}"/>' for x in (cx - gap, cx + gap))


def body(c, cy=252, rx=86, ry=68):
    return f'<ellipse cx="120" cy="{cy}" rx="{rx}" ry="{ry}" fill="{c}"/>'


def star(cx, cy, R, r, n=5, rot=-90, fill="#000"):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n)
        rad = R if i % 2 == 0 else r
        pts.append(f'{cx + rad * math.cos(a):.1f},{cy + rad * math.sin(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{fill}" stroke-width="2" stroke-linejoin="round"/>'


def heart(cx, cy, s, fill):
    return (f'<path d="M{cx} {cy+0.9*s:.1f} C{cx-1.4*s:.1f} {cy+0.1*s:.1f} {cx-0.9*s:.1f} {cy-1.0*s:.1f} {cx} {cy-0.35*s:.1f} '
            f'C{cx+0.9*s:.1f} {cy-1.0*s:.1f} {cx+1.4*s:.1f} {cy+0.1*s:.1f} {cx} {cy+0.9*s:.1f} Z" fill="{fill}"/>')


def daisy(cx, cy, petal="#fff", center="#FFC93C"):
    s = ''
    for i in range(6):
        a = math.radians(i * 60)
        s += f'<circle cx="{cx + 5 * math.cos(a):.1f}" cy="{cy + 5 * math.sin(a):.1f}" r="4.2" fill="{petal}"/>'
    return s + f'<circle cx="{cx}" cy="{cy}" r="3.6" fill="{center}"/>'


def flower(cx, cy, petal, center):
    s = ''
    for i in range(5):
        a = math.radians(-90 + i * 72)
        s += f'<circle cx="{cx + 8 * math.cos(a):.1f}" cy="{cy + 8 * math.sin(a):.1f}" r="7" fill="{petal}"/>'
    return s + f'<circle cx="{cx}" cy="{cy}" r="5.5" fill="{center}"/>'


A = {}

# 01 Лиса в наушниках
A[1] = ("#2EC4B6",
        body("#3B3FA8")
        + '<ellipse cx="120" cy="194" rx="28" ry="16" fill="#FFF4E8"/>'
        + '<path d="M60 110 L68 38 L114 76 Z" fill="#FF8A3D"/><path d="M70 94 L74 56 L100 78 Z" fill="#FFE2C6"/>'
        + '<path d="M180 110 L172 38 L126 76 Z" fill="#FF8A3D"/><path d="M170 94 L166 56 L140 78 Z" fill="#FFE2C6"/>'
        + '<ellipse cx="120" cy="124" rx="64" ry="56" fill="#FF8A3D"/>'
        + '<path d="M58 128 Q66 176 120 180 Q174 176 182 128 Q156 150 120 136 Q84 150 58 128 Z" fill="#FFF4E8"/>'
        + eyes(116, gap=25, rx=8.5)
        + '<ellipse cx="120" cy="146" rx="8" ry="6" fill="#1E1646"/>'
        + smile(155, w=8)
        + blush(142, gap=44)
        + '<path d="M50 120 Q46 40 120 40 Q194 40 190 120" fill="none" stroke="#1E1646" stroke-width="9" stroke-linecap="round"/>'
        + '<rect x="36" y="100" width="26" height="46" rx="12" fill="#D7FF45"/><rect x="178" y="100" width="26" height="46" rx="12" fill="#D7FF45"/>'
        + '<rect x="54" y="108" width="8" height="30" rx="4" fill="#1E1646"/><rect x="178" y="108" width="8" height="30" rx="4" fill="#1E1646"/>')

# 02 Енот в шапке
A[2] = ("#FF7BC8",
        body("#FFC93C")
        + '<path d="M56 136 L42 152 L64 152 Z" fill="#9C99B8"/><path d="M184 136 L198 152 L176 152 Z" fill="#9C99B8"/>'
        + '<ellipse cx="120" cy="128" rx="64" ry="56" fill="#9C99B8"/>'
        + '<path d="M58 124 Q88 100 120 120 Q152 100 182 124 Q178 150 150 148 Q132 147 120 134 Q108 147 90 148 Q62 150 58 124 Z" fill="#3B3656"/>'
        + '<ellipse cx="120" cy="158" rx="30" ry="20" fill="#EEEAF8"/>'
        + '<circle cx="94" cy="126" r="11" fill="#fff"/><circle cx="146" cy="126" r="11" fill="#fff"/>'
        + '<circle cx="96" cy="127" r="6.5" fill="#1E1646"/><circle cx="148" cy="127" r="6.5" fill="#1E1646"/>'
        + '<circle cx="98.5" cy="124" r="2.2" fill="#fff"/><circle cx="150.5" cy="124" r="2.2" fill="#fff"/>'
        + '<ellipse cx="120" cy="148" rx="7" ry="5" fill="#1E1646"/>'
        + smile(157, w=7)
        + '<path d="M60 100 Q60 40 120 40 Q180 40 180 100 Z" fill="#4C6BFF"/>'
        + '<path d="M92 50 V94 M120 42 V94 M148 50 V94" stroke="#3A56E0" stroke-width="4" stroke-linecap="round"/>'
        + '<rect x="54" y="88" width="132" height="22" rx="11" fill="#3A56E0"/>'
        + '<circle cx="120" cy="36" r="14" fill="#FFFFFF"/>'
        + '<circle cx="72" cy="56" r="16" fill="#9C99B8"/><circle cx="72" cy="56" r="8" fill="#3B3656"/>'
        + '<circle cx="168" cy="56" r="16" fill="#9C99B8"/><circle cx="168" cy="56" r="8" fill="#3B3656"/>')

# 03 Панда в очках-звёздах
A[3] = ("#FFC93C",
        body("#FF5E7E")
        + '<circle cx="66" cy="74" r="22" fill="#26213F"/><circle cx="174" cy="74" r="22" fill="#26213F"/>'
        + '<ellipse cx="120" cy="128" rx="66" ry="58" fill="#FFFFFF"/>'
        + '<ellipse cx="92" cy="122" rx="17" ry="22" transform="rotate(30 92 122)" fill="#26213F"/>'
        + '<ellipse cx="148" cy="122" rx="17" ry="22" transform="rotate(-30 148 122)" fill="#26213F"/>'
        + star(92, 118, 24, 11.5, fill="#FF5FA2") + star(148, 118, 24, 11.5, fill="#FF5FA2")
        + star(92, 119, 15, 7.5, fill="#3A1D5C") + star(148, 119, 15, 7.5, fill="#3A1D5C")
        + '<path d="M86 114 L91 110 M142 114 L147 110" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'
        + '<path d="M114 112 Q120 106 126 112" fill="none" stroke="#FF5FA2" stroke-width="5" stroke-linecap="round"/>'
        + '<ellipse cx="120" cy="150" rx="8" ry="6" fill="#26213F"/>'
        + open_mouth(158, w=9)
        + blush(150, gap=48))

# 04 Кот в панаме
A[4] = ("#7C83FF",
        body("#2EC4B6")
        + '<ellipse cx="120" cy="130" rx="62" ry="54" fill="#FFD3A1"/>'
        + '<path d="M58 126 H76 M58 138 H74 M182 126 H164 M182 138 H166" stroke="#F0A35E" stroke-width="4" stroke-linecap="round"/>'
        + '<path d="M74 84 Q76 38 120 36 Q164 38 166 84 Z" fill="#FF5E7E"/>'
        + '<path d="M75 70 H165 L166 84 H74 Z" fill="#D63E60"/>'
        + '<path d="M80 62 L72 22 L108 44 Z" fill="#FFD3A1"/><path d="M84 54 L79 32 L100 46 Z" fill="#FF9DB5"/>'
        + '<path d="M160 62 L168 22 L132 44 Z" fill="#FFD3A1"/><path d="M156 54 L161 32 L140 46 Z" fill="#FF9DB5"/>'
        + '<ellipse cx="120" cy="86" rx="76" ry="13" fill="#FF5E7E"/>'
        + eyes(124, gap=24, rx=8.5)
        + '<path d="M114 140 H126 L120 147 Z" fill="#FF7A9A" stroke="#FF7A9A" stroke-width="3" stroke-linejoin="round"/>'
        + '<path d="M110 152 Q115 158 120 152 Q125 158 130 152" fill="none" stroke="#1E1646" stroke-width="4" stroke-linecap="round"/>'
        + blush(144, gap=42))

# 05 Сова в шарфе
A[5] = ("#7BE495",
        '<ellipse cx="120" cy="236" rx="80" ry="72" fill="#3E4BB8"/><ellipse cx="120" cy="246" rx="46" ry="50" fill="#9FB0FF"/>'
        + '<path d="M60 84 L56 38 L98 64 Z" fill="#3E4BB8"/><path d="M180 84 L184 38 L142 64 Z" fill="#3E4BB8"/>'
        + '<ellipse cx="120" cy="112" rx="68" ry="58" fill="#3E4BB8"/>'
        + '<circle cx="93" cy="112" r="29" fill="#FFE7B0"/><circle cx="147" cy="112" r="29" fill="#FFE7B0"/>'
        + '<circle cx="93" cy="112" r="13" fill="#1E1646"/><circle cx="147" cy="112" r="13" fill="#1E1646"/>'
        + '<circle cx="98" cy="106" r="4.5" fill="#fff"/><circle cx="152" cy="106" r="4.5" fill="#fff"/>'
        + '<path d="M111 132 H129 L120 148 Z" fill="#FF9F40" stroke="#FF9F40" stroke-width="3" stroke-linejoin="round"/>'
        + '<path d="M56 160 Q120 188 184 160 L188 184 Q120 214 52 184 Z" fill="#FF5E7E"/>'
        + '<path d="M82 168 L94 172 L92 199 L80 195 Z M114 175 H126 V201 H114 Z M146 172 L158 168 L160 195 L148 199 Z" fill="#fff"/>'
        + '<path d="M136 192 L160 188 L170 240 L144 240 Z" fill="#E24366"/>'
        + '<path d="M140 212 L164 208 L166 218 L142 222 Z" fill="#fff"/>')

# 06 Медведь в кепке
A[6] = ("#5AA9FF",
        body("#FFC93C")
        + '<circle cx="62" cy="86" r="22" fill="#B9763F"/><circle cx="62" cy="86" r="11" fill="#8A5229"/>'
        + '<circle cx="178" cy="86" r="22" fill="#B9763F"/><circle cx="178" cy="86" r="11" fill="#8A5229"/>'
        + '<ellipse cx="120" cy="130" rx="66" ry="58" fill="#B9763F"/>'
        + '<path d="M64 102 Q62 46 120 44 Q178 46 176 102 Q120 90 64 102 Z" fill="#2B2B6B"/>'
        + '<path d="M92 52 Q88 70 90 96 M148 52 Q152 70 150 96" fill="none" stroke="#3F3F8F" stroke-width="4" stroke-linecap="round"/>'
        + '<path d="M102 97 Q102 80 120 80 Q138 80 138 97 Z" fill="#B9763F"/>'
        + '<rect x="98" y="92" width="44" height="7" rx="3.5" fill="#D7FF45"/>'
        + '<circle cx="120" cy="45" r="5" fill="#D7FF45"/>'
        + '<ellipse cx="120" cy="154" rx="28" ry="21" fill="#F2CFA3"/>'
        + '<ellipse cx="120" cy="145" rx="9" ry="6.5" fill="#1E1646"/>'
        + smile(156, w=8)
        + eyes(124, gap=27, rx=8.5)
        + blush(146, gap=48))

# 07 Зайка с бантом
A[7] = ("#FF5E7E",
        body("#4C7DFF")
        + '<ellipse cx="94" cy="50" rx="18" ry="46" transform="rotate(-12 94 50)" fill="#FFF4F6"/>'
        + '<ellipse cx="94" cy="54" rx="8" ry="32" transform="rotate(-12 94 54)" fill="#FFB3C7"/>'
        + '<ellipse cx="146" cy="50" rx="18" ry="46" transform="rotate(14 146 50)" fill="#FFF4F6"/>'
        + '<ellipse cx="146" cy="54" rx="8" ry="32" transform="rotate(14 146 54)" fill="#FFB3C7"/>'
        + '<ellipse cx="120" cy="134" rx="62" ry="54" fill="#FFF4F6"/>'
        + '<path d="M154 88 L134 76 L134 100 Z" fill="#D7FF45" stroke="#D7FF45" stroke-width="4" stroke-linejoin="round"/>'
        + '<path d="M154 88 L174 76 L174 100 Z" fill="#D7FF45" stroke="#D7FF45" stroke-width="4" stroke-linejoin="round"/>'
        + '<circle cx="154" cy="88" r="7" fill="#A8D11F"/>'
        + eyes(128, gap=24, rx=8.5)
        + '<ellipse cx="120" cy="145" rx="6" ry="4.5" fill="#FF7A9A"/>'
        + '<rect x="115.5" y="153" width="9" height="8" rx="2" fill="#fff" stroke="#1E1646" stroke-width="2"/>'
        + '<path d="M111 152 Q115.5 157 120 152 Q124.5 157 129 152" fill="none" stroke="#1E1646" stroke-width="3.5" stroke-linecap="round"/>'
        + blush(144, gap=42))

# 08 Пингвин в гоглах
A[8] = ("#FFE1A8",
        '<ellipse cx="120" cy="236" rx="84" ry="76" fill="#26214A"/><ellipse cx="120" cy="244" rx="54" ry="60" fill="#FFFFFF"/>'
        + '<ellipse cx="120" cy="118" rx="68" ry="62" fill="#26214A"/>'
        + '<circle cx="98" cy="128" r="30" fill="#fff"/><circle cx="142" cy="128" r="30" fill="#fff"/>'
        + '<ellipse cx="120" cy="148" rx="40" ry="26" fill="#fff"/>'
        + eyes(126, gap=22, rx=8)
        + '<path d="M106 142 Q120 134 134 142 Q120 158 106 142 Z" fill="#FF9F40"/>'
        + blush(150, gap=44)
        + '<path d="M52 92 Q120 70 188 92" fill="none" stroke="#FF5FA2" stroke-width="10"/>'
        + '<circle cx="96" cy="80" r="17" fill="#FFC93C"/><circle cx="96" cy="80" r="11" fill="#8EE7FF"/>'
        + '<circle cx="144" cy="80" r="17" fill="#FFC93C"/><circle cx="144" cy="80" r="11" fill="#8EE7FF"/>'
        + '<path d="M91 77 L96 72 M139 77 L144 72" stroke="#fff" stroke-width="3" stroke-linecap="round"/>')

# 09 Лягушка в короне
A[9] = ("#B57BFF",
        body("#FF9F40")
        + '<circle cx="84" cy="92" r="27" fill="#6BD66B"/><circle cx="156" cy="92" r="27" fill="#6BD66B"/>'
        + '<ellipse cx="120" cy="138" rx="76" ry="52" fill="#6BD66B"/>'
        + '<ellipse cx="120" cy="168" rx="48" ry="18" fill="#A6EC8A"/>'
        + '<circle cx="84" cy="92" r="17" fill="#fff"/><circle cx="156" cy="92" r="17" fill="#fff"/>'
        + '<circle cx="86" cy="94" r="9" fill="#1E1646"/><circle cx="158" cy="94" r="9" fill="#1E1646"/>'
        + '<circle cx="89" cy="90" r="3" fill="#fff"/><circle cx="161" cy="90" r="3" fill="#fff"/>'
        + '<circle cx="113" cy="132" r="2.5" fill="#1E1646"/><circle cx="127" cy="132" r="2.5" fill="#1E1646"/>'
        + '<path d="M86 148 Q120 172 154 148" fill="none" stroke="#1E1646" stroke-width="5" stroke-linecap="round"/>'
        + blush(150, gap=48)
        + '<path d="M102 88 L102 68 L111 77 L120 62 L129 77 L138 68 L138 88 Z" fill="#FFC93C" stroke="#E0A800" stroke-width="2.5" stroke-linejoin="round"/>'
        + '<circle cx="120" cy="80" r="3.5" fill="#FF5E7E"/>')

# 10 Аксолотль в очках-сердечках
gl = ''
for (cx, cy, rot) in ((60, 98, -35), (52, 124, 0), (60, 150, 35), (180, 98, 35), (188, 124, 0), (180, 150, -35)):
    gl += f'<ellipse cx="{cx}" cy="{cy}" rx="24" ry="9" transform="rotate({rot} {cx} {cy})" fill="#FF5FA2"/>'
A[10] = ("#B8F2E6",
         body("#7C83FF")
         + gl
         + '<ellipse cx="120" cy="128" rx="64" ry="54" fill="#FFB3CF"/>'
         + '<circle cx="104" cy="102" r="4" fill="#FF8DB8"/><circle cx="146" cy="106" r="3" fill="#FF8DB8"/>'
         + eyes(126, gap=34, rx=7.5)
         + '<path d="M98 146 Q120 162 142 146" fill="none" stroke="#1E1646" stroke-width="4.5" stroke-linecap="round"/>'
         + blush(142, gap=46)
         + heart(100, 86, 13, "#4C7DFF") + heart(140, 86, 13, "#4C7DFF")
         + heart(100, 86, 8, "#9FC0FF") + heart(140, 86, 8, "#9FC0FF")
         + '<path d="M112 84 Q120 79 128 84" fill="none" stroke="#4C7DFF" stroke-width="4" stroke-linecap="round"/>')

# 11 Капибара в бандане
A[11] = ("#C6F35E",
         body("#B0794A")
         + '<ellipse cx="76" cy="72" rx="11" ry="9" fill="#8D5A33"/><ellipse cx="164" cy="72" rx="11" ry="9" fill="#8D5A33"/>'
         + '<rect x="62" y="64" width="116" height="128" rx="52" fill="#B0794A"/>'
         + '<rect x="78" y="126" width="84" height="58" rx="29" fill="#9C6740"/>'
         + '<ellipse cx="106" cy="142" rx="4" ry="6" fill="#1E1646"/><ellipse cx="134" cy="142" rx="4" ry="6" fill="#1E1646"/>'
         + '<path d="M82 112 Q93 102 104 112 M136 112 Q147 102 158 112" fill="none" stroke="#1E1646" stroke-width="5" stroke-linecap="round"/>'
         + '<path d="M112 166 Q120 172 128 166" fill="none" stroke="#1E1646" stroke-width="4" stroke-linecap="round"/>'
         + blush(128, gap=48)
         + '<path d="M66 188 Q120 204 174 188 L120 238 Z" fill="#4C7DFF" stroke="#4C7DFF" stroke-width="4" stroke-linejoin="round"/>'
         + '<circle cx="100" cy="204" r="3.5" fill="#fff"/><circle cx="126" cy="208" r="3.5" fill="#fff"/>'
         + '<circle cx="114" cy="222" r="3" fill="#fff"/><circle cx="146" cy="200" r="3" fill="#fff"/>'
         + '<path d="M120 66 Q106 46 120 34 Q132 50 120 66 Z" fill="#2FA84F"/>'
         + '<path d="M120 66 Q140 52 150 60 Q138 74 120 66 Z" fill="#43C463"/>')

# 12 Ленивец с маской для сна
A[12] = ("#9B6BFF",
         body("#2EC4B6")
         + '<ellipse cx="120" cy="128" rx="64" ry="58" fill="#C9A27E"/>'
         + '<ellipse cx="120" cy="136" rx="50" ry="42" fill="#F4E2C8"/>'
         + '<ellipse cx="94" cy="128" rx="19" ry="11" transform="rotate(18 94 128)" fill="#6E5141"/>'
         + '<ellipse cx="146" cy="128" rx="19" ry="11" transform="rotate(-18 146 128)" fill="#6E5141"/>'
         + '<circle cx="96" cy="127" r="7.5" fill="#fff"/><circle cx="144" cy="127" r="7.5" fill="#fff"/>'
         + '<circle cx="97" cy="128" r="4.5" fill="#1E1646"/><circle cx="145" cy="128" r="4.5" fill="#1E1646"/>'
         + '<ellipse cx="120" cy="146" rx="9" ry="6" fill="#6E5141"/>'
         + smile(156, w=9)
         + blush(150, gap=40)
         + '<path d="M56 98 Q120 80 184 98" fill="none" stroke="#FF7BC8" stroke-width="7"/>'
         + '<path d="M80 86 Q80 64 102 64 H138 Q160 64 160 86 Q160 100 140 98 Q120 94 100 98 Q80 100 80 86 Z" fill="#FF7BC8"/>'
         + '<path d="M90 80 Q100 88 110 80 M130 80 Q140 88 150 80" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'
         + '<path d="M94 86 L92 91 M100 88 V93 M106 86 L108 91 M134 86 L132 91 M140 88 V93 M146 86 L148 91" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>')

# 13 Дракончик в очках
A[13] = ("#FFA94D",
         '<path d="M44 214 Q14 170 44 150 Q50 178 72 192 Z" fill="#1F9E74"/><path d="M196 214 Q226 170 196 150 Q190 178 168 192 Z" fill="#1F9E74"/>'
         + body("#2FBF8F")
         + '<ellipse cx="120" cy="242" rx="40" ry="44" fill="#C8F7D8"/>'
         + '<path d="M82 80 Q70 44 88 30 Q92 56 100 72 Z" fill="#FFE08A"/><path d="M158 80 Q170 44 152 30 Q148 56 140 72 Z" fill="#FFE08A"/>'
         + '<path d="M106 76 L113 56 L121 74 Z M119 74 L128 54 L135 76 Z" fill="#FF7A59" stroke="#FF7A59" stroke-width="3" stroke-linejoin="round"/>'
         + '<ellipse cx="120" cy="126" rx="64" ry="56" fill="#2FBF8F"/>'
         + '<ellipse cx="120" cy="154" rx="34" ry="22" fill="#6FE0B4"/>'
         + '<ellipse cx="110" cy="148" rx="3" ry="4" fill="#1E1646"/><ellipse cx="130" cy="148" rx="3" ry="4" fill="#1E1646"/>'
         + smile(159, w=10)
         + eyes(118, gap=26, rx=7.5)
         + '<circle cx="94" cy="118" r="19" fill="#fff" fill-opacity=".22" stroke="#1E1646" stroke-width="5"/>'
         + '<circle cx="146" cy="118" r="19" fill="#fff" fill-opacity=".22" stroke="#1E1646" stroke-width="5"/>'
         + '<path d="M113 116 Q120 110 127 116 M75 115 L60 111 M165 115 L180 111" fill="none" stroke="#1E1646" stroke-width="5" stroke-linecap="round"/>'
         + blush(146, gap=50))

# 14 Единорог с цветком
A[14] = ("#5B6CF0",
         '<circle cx="70" cy="96" r="22" fill="#FF7BC8"/><circle cx="62" cy="128" r="20" fill="#FFC93C"/>'
         + '<circle cx="68" cy="158" r="18" fill="#7BE495"/><circle cx="80" cy="186" r="16" fill="#8EC5FF"/>'
         + '<ellipse cx="124" cy="252" rx="80" ry="66" fill="#FFF8FB"/>'
         + '<path d="M86 86 L88 52 L108 76 Z" fill="#FFF8FB"/><path d="M162 86 L160 52 L140 76 Z" fill="#FFF8FB"/>'
         + '<path d="M91 78 L92 62 L102 74 Z M157 78 L156 62 L146 74 Z" fill="#FFB3D1"/>'
         + '<ellipse cx="124" cy="128" rx="58" ry="56" fill="#FFF8FB"/>'
         + '<path d="M114 78 L124 26 L134 78 Z" fill="#FFC93C" stroke="#FFC93C" stroke-width="3" stroke-linejoin="round"/>'
         + '<path d="M117 66 L131 60 M119 53 L129 48 M121 40 L127 37" stroke="#E0A000" stroke-width="3" stroke-linecap="round"/>'
         + '<circle cx="104" cy="80" r="14" fill="#B57BFF"/><circle cx="90" cy="88" r="11" fill="#FF7BC8"/>'
         + '<ellipse cx="124" cy="154" rx="32" ry="20" fill="#FFD6E6"/>'
         + '<ellipse cx="114" cy="152" rx="3" ry="4" fill="#C2577E"/><ellipse cx="134" cy="152" rx="3" ry="4" fill="#C2577E"/>'
         + smile(162, w=8, cx=124)
         + eyes(122, gap=24, cx=124, rx=8)
         + blush(140, gap=44, cx=124)
         + flower(166, 80, "#FF5E7E", "#FFD86B"))

# 15 Йети в меховых наушниках
fluff = "#F3F8FF"
A[15] = ("#FF8FA3",
         body(fluff, rx=88)
         + f'<circle cx="62" cy="198" r="18" fill="{fluff}"/><circle cx="178" cy="198" r="18" fill="{fluff}"/>'
         + '<path d="M80 84 Q64 60 78 44 Q86 64 94 76 Z" fill="#C7B8FF"/><path d="M160 84 Q176 60 162 44 Q154 64 146 76 Z" fill="#C7B8FF"/>'
         + f'<ellipse cx="120" cy="126" rx="64" ry="60" fill="{fluff}"/>'
         + f'<circle cx="96" cy="74" r="16" fill="{fluff}"/><circle cx="120" cy="68" r="18" fill="{fluff}"/><circle cx="144" cy="74" r="16" fill="{fluff}"/>'
         + f'<circle cx="84" cy="180" r="14" fill="{fluff}"/><circle cx="156" cy="180" r="14" fill="{fluff}"/>'
         + '<ellipse cx="120" cy="134" rx="44" ry="38" fill="#8FD0FF"/>'
         + eyes(126, gap=18, rx=8)
         + open_mouth(146, w=11)
         + '<path d="M111 146 L114 152 L117 146 Z M123 146 L126 152 L129 146 Z" fill="#fff"/>'
         + blush(142, gap=32)
         + '<path d="M60 120 Q60 54 120 52 Q180 54 180 120" fill="none" stroke="#7C83FF" stroke-width="9" stroke-linecap="round"/>'
         + '<circle cx="56" cy="126" r="21" fill="#FFC93C"/><circle cx="56" cy="126" r="13" fill="#FFE38A"/>'
         + '<circle cx="184" cy="126" r="21" fill="#FFC93C"/><circle cx="184" cy="126" r="13" fill="#FFE38A"/>')

# 16 Привидение в колпаке
A[16] = ("#40B4E5",
         '<ellipse cx="42" cy="160" rx="13" ry="24" transform="rotate(30 42 160)" fill="#fff"/>'
         + '<ellipse cx="196" cy="196" rx="13" ry="22" transform="rotate(-20 196 196)" fill="#E4E0FF"/>'
         + '<path d="M50 240 V126 Q50 56 120 56 Q190 56 190 126 V240 Z" fill="#FFFFFF"/>'
         + '<path d="M168 76 Q190 96 190 126 V240 H170 Q176 160 168 76 Z" fill="#E4E0FF"/>'
         + eyes(122, gap=24, rx=10, ry=13)
         + open_mouth(146, w=10)
         + blush(142, gap=44)
         + '<path d="M96 66 L130 6 L154 64 Q124 54 96 66 Z" fill="#FFC93C" stroke="#FFC93C" stroke-width="3" stroke-linejoin="round"/>'
         + '<circle cx="122" cy="44" r="4" fill="#FF5E7E"/><circle cx="133" cy="27" r="3.5" fill="#7C83FF"/>'
         + '<circle cx="140" cy="52" r="4" fill="#7C83FF"/><circle cx="112" cy="58" r="3.5" fill="#FF5E7E"/>'
         + '<circle cx="130" cy="8" r="8" fill="#FF5FA2"/>')

# 17 Пришелец в тёмных очках
A[17] = ("#E97BFF",
         body("#2B2B6B")
         + '<path d="M120 192 V240" stroke="#D7FF45" stroke-width="4"/>'
         + '<path d="M98 66 Q90 40 80 26 M142 66 Q150 40 160 26" fill="none" stroke="#7BD65A" stroke-width="6" stroke-linecap="round"/>'
         + '<circle cx="80" cy="24" r="9" fill="#FFC93C"/><circle cx="160" cy="24" r="9" fill="#FFC93C"/>'
         + '<path d="M120 58 Q188 58 188 120 Q186 168 120 192 Q54 168 52 120 Q52 58 120 58 Z" fill="#8EF06C"/>'
         + '<circle cx="72" cy="150" r="5" fill="#6FD34E"/><circle cx="166" cy="146" r="4" fill="#6FD34E"/><circle cx="98" cy="76" r="4" fill="#6FD34E"/><circle cx="150" cy="80" r="3" fill="#6FD34E"/>'
         + '<path d="M62 108 Q62 98 74 98 H166 Q178 98 178 108 L174 124 Q170 138 152 138 H134 Q124 138 120 126 Q116 138 106 138 H88 Q70 138 66 124 Z" fill="#1E1646"/>'
         + '<path d="M78 108 L92 108 M146 108 L160 108" stroke="#8EE7FF" stroke-width="4" stroke-linecap="round"/>'
         + open_mouth(154, w=12)
         + blush(154, gap=46))

# 18 Циклоп в кепке с пропеллером
A[18] = ("#FFEF7A",
         body("#FF5FA2")
         + '<path d="M66 96 Q48 66 62 46 Q70 70 86 84 Z" fill="#FFF0C2"/><path d="M174 96 Q192 66 178 46 Q170 70 154 84 Z" fill="#FFF0C2"/>'
         + '<ellipse cx="120" cy="130" rx="66" ry="58" fill="#6D5BFF"/>'
         + '<circle cx="78" cy="152" r="7" fill="#8676FF"/><circle cx="164" cy="160" r="5" fill="#8676FF"/><circle cx="162" cy="106" r="6" fill="#8676FF"/>'
         + '<circle cx="120" cy="120" r="25" fill="#fff"/><circle cx="122" cy="122" r="14" fill="#2EC4B6"/>'
         + '<circle cx="122" cy="122" r="7" fill="#1E1646"/><circle cx="127" cy="116" r="4" fill="#fff"/>'
         + '<path d="M100 156 Q120 180 140 156 Z" fill="#1E1646" stroke="#1E1646" stroke-width="2" stroke-linejoin="round"/>'
         + '<rect x="106" y="156" width="8" height="7" rx="1.5" fill="#fff"/><rect x="126" y="156" width="8" height="7" rx="1.5" fill="#fff"/>'
         + blush(150, gap=48)
         + '<path d="M86 84 Q86 50 120 50 Q154 50 154 84 Z" fill="#FFC93C"/>'
         + '<path d="M114 84 Q112 54 120 50 Q128 54 126 84 Z" fill="#FF5E7E"/>'
         + '<path d="M118 84 Q146 80 168 90 Q146 96 118 88 Z" fill="#FF5E7E"/>'
         + '<path d="M120 50 V36" stroke="#1E1646" stroke-width="4"/>'
         + '<ellipse cx="104" cy="35" rx="16" ry="5" fill="#4FD1C5"/><ellipse cx="136" cy="35" rx="16" ry="5" fill="#FF5E7E"/>'
         + '<circle cx="120" cy="35" r="4.5" fill="#1E1646"/>')

# 19 Осьминог в бескозырке
A[19] = ("#6EC1FF",
         '<path d="M80 166 Q54 200 66 240 M106 176 Q100 212 90 244 M134 176 Q140 212 150 244 M160 166 Q186 200 174 240" fill="none" stroke="#FF6F6F" stroke-width="24" stroke-linecap="round"/>'
         + '<circle cx="62" cy="216" r="3.5" fill="#FFC2C2"/><circle cx="94" cy="222" r="3.5" fill="#FFC2C2"/><circle cx="146" cy="222" r="3.5" fill="#FFC2C2"/><circle cx="178" cy="216" r="3.5" fill="#FFC2C2"/>'
         + '<ellipse cx="120" cy="118" rx="64" ry="66" fill="#FF6F6F"/>'
         + '<circle cx="84" cy="94" r="6" fill="#FF9A9A"/><circle cx="160" cy="102" r="8" fill="#FF9A9A"/><circle cx="148" cy="76" r="4" fill="#FF9A9A"/>'
         + eyes(126, gap=24, rx=9.5)
         + smile(150, w=9)
         + blush(146, gap=44, c="#FFC0D0", op=0.7)
         + '<g transform="rotate(8 120 60)">'
         + '<path d="M88 66 Q88 38 120 38 Q152 38 152 66 Z" fill="#FFFFFF"/>'
         + '<rect x="80" y="58" width="80" height="16" rx="8" fill="#FFFFFF"/><rect x="80" y="63" width="80" height="5" fill="#4C7DFF"/>'
         + '<path d="M158 66 L172 82 L164 84 Z" fill="#4C7DFF"/></g>')

# 20 Ёжик в венке
crown = ''
for (x, y) in ((88, 98), (103, 89), (120, 86), (137, 89), (152, 98)):
    crown += daisy(x, y)
A[20] = ("#36C9A0",
         body("#FF5FA2")
         + star(120, 122, 88, 64, n=16, fill="#8A5A3C")
         + '<circle cx="76" cy="100" r="12" fill="#F5D9B5"/><circle cx="76" cy="100" r="6" fill="#E3A98A"/>'
         + '<circle cx="164" cy="100" r="12" fill="#F5D9B5"/><circle cx="164" cy="100" r="6" fill="#E3A98A"/>'
         + '<ellipse cx="120" cy="136" rx="54" ry="48" fill="#F5D9B5"/>'
         + eyes(128, gap=22, rx=8)
         + '<ellipse cx="120" cy="148" rx="9" ry="7" fill="#1E1646"/>'
         + smile(158, w=8)
         + blush(148, gap=36)
         + '<ellipse cx="96" cy="92" rx="5" ry="3" transform="rotate(-30 96 92)" fill="#43C463"/>'
         + '<ellipse cx="144" cy="92" rx="5" ry="3" transform="rotate(30 144 92)" fill="#43C463"/>'
         + crown)

# 21 Тигрёнок с повязкой
A[21] = ("#CFC6FF",
         body("#2EC4B6")
         + '<circle cx="70" cy="80" r="18" fill="#FF9A3C"/><circle cx="70" cy="80" r="9" fill="#FFF4E6"/>'
         + '<circle cx="170" cy="80" r="18" fill="#FF9A3C"/><circle cx="170" cy="80" r="9" fill="#FFF4E6"/>'
         + '<ellipse cx="120" cy="128" rx="66" ry="56" fill="#FF9A3C"/>'
         + '<path d="M54 120 L76 124 L56 130 Z M54 140 L74 142 L56 148 Z M186 120 L164 124 L184 130 Z M186 140 L166 142 L184 148 Z" fill="#2A1E44"/>'
         + '<path d="M112 74 L120 86 L128 74 Z M96 78 L102 88 L90 82 Z M144 78 L138 88 L150 82 Z" fill="#2A1E44"/>'
         + '<ellipse cx="108" cy="152" rx="16" ry="13" fill="#FFF4E6"/><ellipse cx="132" cy="152" rx="16" ry="13" fill="#FFF4E6"/>'
         + '<path d="M112 140 H128 L120 148 Z" fill="#1E1646" stroke="#1E1646" stroke-width="3" stroke-linejoin="round"/>'
         + '<path d="M110 160 Q115 166 120 160 Q125 166 130 160" fill="none" stroke="#1E1646" stroke-width="3.5" stroke-linecap="round"/>'
         + eyes(125, gap=26, rx=8.5)
         + '<path d="M56 100 Q120 82 184 100 L184 114 Q120 96 56 114 Z" fill="#FFFFFF"/>'
         + '<path d="M56 105 Q120 87 184 105 L184 109 Q120 91 56 109 Z" fill="#FF5FA2"/>')

# 22 Коала с жвачкой
A[22] = ("#F25F9C",
         body("#FF9F40")
         + '<circle cx="62" cy="94" r="32" fill="#A7B0C8"/><circle cx="62" cy="96" r="19" fill="#F2DDE6"/>'
         + '<circle cx="178" cy="94" r="32" fill="#A7B0C8"/><circle cx="178" cy="96" r="19" fill="#F2DDE6"/>'
         + '<ellipse cx="120" cy="130" rx="62" ry="56" fill="#A7B0C8"/>'
         + '<ellipse cx="120" cy="164" rx="34" ry="18" fill="#C9CFDF"/>'
         + eyes(120, gap=30, rx=7.5)
         + '<ellipse cx="120" cy="140" rx="14" ry="18" fill="#3B3656"/><ellipse cx="115" cy="132" rx="3" ry="5" fill="#6E6990"/>'
         + blush(148, gap=44)
         + '<circle cx="128" cy="174" r="22" fill="#FF8FCB"/><ellipse cx="120" cy="166" rx="6" ry="4" fill="#FFD1EA"/>')

# 23 Слайм с вишенкой
A[23] = ("#FF7A59",
         '<path d="M40 240 Q34 186 58 150 Q74 84 120 80 Q166 84 182 150 Q206 186 200 240 Z" fill="#6E7BFF"/>'
         + '<path d="M40 240 Q60 220 120 222 Q180 220 200 240 Z" fill="#5A66E8"/>'
         + '<ellipse cx="84" cy="128" rx="9" ry="18" transform="rotate(20 84 128)" fill="#fff" opacity=".45"/>'
         + '<circle cx="98" cy="104" r="5" fill="#fff" opacity=".45"/>'
         + eyes(146, gap=22, rx=10)
         + open_mouth(168, w=11)
         + blush(166, gap=44)
         + '<path d="M122 82 Q126 58 144 46" fill="none" stroke="#2E7D32" stroke-width="4" stroke-linecap="round"/>'
         + '<path d="M134 54 Q150 40 158 50 Q146 60 134 54 Z" fill="#43C463"/>'
         + '<circle cx="120" cy="80" r="13" fill="#FF3B5C"/><circle cx="115" cy="75" r="3.5" fill="#fff" opacity=".7"/>')

# 24 Фениксёнок с наушниками на шее
A[24] = ("#2F5BD8",
         '<ellipse cx="52" cy="214" rx="18" ry="34" transform="rotate(25 52 214)" fill="#FF9F2D"/>'
         + '<ellipse cx="188" cy="214" rx="18" ry="34" transform="rotate(-25 188 214)" fill="#FF9F2D"/>'
         + '<ellipse cx="120" cy="246" rx="80" ry="70" fill="#FFB13D"/>'
         + '<path d="M98 80 Q86 44 104 24 Q104 48 118 58 Q114 32 136 16 Q132 46 142 78 Z" fill="#FF5A3D"/>'
         + '<path d="M108 76 Q104 54 112 42 Q114 60 124 66 Q124 48 132 38 Q130 58 134 76 Z" fill="#FFE14D"/>'
         + '<ellipse cx="120" cy="124" rx="62" ry="58" fill="#FFC93D"/>'
         + eyes(120, gap=24, rx=8.5)
         + '<path d="M108 138 H132 L120 154 Z" fill="#FF6A2D" stroke="#FF6A2D" stroke-width="4" stroke-linejoin="round"/>'
         + blush(142, gap=42)
         + '<path d="M66 188 Q120 216 174 188" fill="none" stroke="#1E1646" stroke-width="8" stroke-linecap="round"/>'
         + '<rect x="48" y="172" width="26" height="34" rx="11" fill="#FF5FA2"/><rect x="166" y="172" width="26" height="34" rx="11" fill="#FF5FA2"/>')

os.makedirs(OUT, exist_ok=True)
for n, (bg, b) in A.items():
    with open(os.path.join(OUT, f'a{n:02d}.svg'), 'w', encoding='utf-8') as f:
        f.write(wrap(bg, b))
print(len(A), 'avatars written')
