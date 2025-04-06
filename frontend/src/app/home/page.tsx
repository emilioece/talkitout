"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-50 p-6 text-center">
      <main className="flex flex-col items-center w-full max-w-4xl">
        <div className="w-full max-w-md mb-4">
          <svg width="100%" height="100%" viewBox="0 0 2112 584" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M128.118 194.494H25.7118V131.328H305.653V194.494H203.247V473H128.118V194.494ZM281.727 301.685C282.684 285.734 286.672 272.495 293.69 261.967C300.709 251.439 309.641 242.985 320.488 236.605C331.335 230.224 343.457 225.758 356.856 223.206C370.574 220.335 384.292 218.899 398.01 218.899C410.452 218.899 423.053 219.856 435.814 221.77C448.575 223.365 460.219 226.715 470.747 231.82C481.275 236.924 489.888 244.102 496.588 253.354C503.287 262.286 506.637 274.249 506.637 289.243V417.969C506.637 429.135 507.275 439.822 508.551 450.03C509.827 460.239 512.06 467.896 515.251 473H446.342C445.066 469.172 443.949 465.343 442.992 461.515C442.354 457.368 441.876 453.221 441.557 449.073C430.71 460.239 417.949 468.055 403.274 472.521C388.599 476.988 373.605 479.221 358.292 479.221C346.488 479.221 335.482 477.785 325.273 474.914C315.064 472.043 306.132 467.577 298.475 461.515C290.819 455.454 284.757 447.797 280.291 438.546C276.144 429.294 274.07 418.288 274.07 405.527C274.07 391.49 276.463 380.005 281.248 371.073C286.353 361.821 292.733 354.483 300.389 349.06C308.365 343.637 317.298 339.649 327.187 337.097C337.396 334.226 347.605 331.992 357.813 330.397C368.022 328.802 378.071 327.526 387.961 326.569C397.851 325.612 406.624 324.176 414.28 322.262C421.937 320.348 427.998 317.636 432.465 314.127C436.931 310.299 439.004 304.876 438.685 297.857C438.685 290.52 437.409 284.777 434.857 280.63C432.624 276.164 429.434 272.814 425.287 270.581C421.458 268.029 416.832 266.433 411.409 265.795C406.305 264.838 400.722 264.36 394.66 264.36C381.262 264.36 370.734 267.231 363.077 272.973C355.421 278.716 350.954 288.286 349.678 301.685H281.727ZM438.685 351.931C435.814 354.483 432.145 356.557 427.679 358.152C423.532 359.428 418.906 360.545 413.802 361.502C409.016 362.459 403.912 363.257 398.489 363.895C393.065 364.533 387.642 365.33 382.219 366.287C377.114 367.244 372.01 368.52 366.906 370.115C362.12 371.711 357.813 373.944 353.985 376.815C350.476 379.367 347.605 382.717 345.372 386.864C343.138 391.011 342.022 396.275 342.022 402.656C342.022 408.717 343.138 413.821 345.372 417.969C347.605 422.116 350.635 425.466 354.464 428.018C358.292 430.251 362.758 431.846 367.863 432.803C372.967 433.76 378.231 434.239 383.654 434.239C397.053 434.239 407.421 432.006 414.759 427.539C422.096 423.073 427.52 417.809 431.029 411.748C434.538 405.367 436.612 398.987 437.25 392.607C438.207 386.226 438.685 381.122 438.685 377.293V351.931ZM561.294 131.328H629.246V473H561.294V131.328ZM688.973 131.328H756.925V314.606L842.582 225.599H922.975L829.662 316.52L933.503 473H851.196L783.244 362.459L756.925 387.821V473H688.973V131.328ZM1898.54 473H1833.94V438.546H1832.51C1823.89 452.902 1812.73 463.27 1799.01 469.65C1785.29 476.031 1771.25 479.221 1756.9 479.221C1738.71 479.221 1723.72 476.828 1711.92 472.043C1700.43 467.258 1691.34 460.558 1684.64 451.945C1677.94 443.012 1673.15 432.325 1670.28 419.883C1667.73 407.122 1666.45 393.085 1666.45 377.772V225.599H1734.41V365.33C1734.41 385.748 1737.6 401.061 1743.98 411.269C1750.36 421.159 1761.68 426.104 1777.95 426.104C1796.46 426.104 1809.85 420.68 1818.15 409.834C1826.44 398.668 1830.59 380.484 1830.59 355.281V225.599H1898.54V473ZM2036.25 225.599H2086.02V271.059H2036.25V393.564C2036.25 405.048 2038.17 412.705 2041.99 416.533C2045.82 420.361 2053.48 422.276 2064.96 422.276C2068.79 422.276 2072.46 422.116 2075.97 421.797C2079.48 421.478 2082.83 420.999 2086.02 420.361V473C2080.28 473.957 2073.9 474.595 2066.88 474.914C2059.86 475.233 2053 475.393 2046.3 475.393C2035.77 475.393 2025.72 474.595 2016.15 473C2006.9 471.724 1998.61 469.012 1991.27 464.865C1984.25 460.718 1978.67 454.816 1974.52 447.159C1970.37 439.503 1968.3 429.454 1968.3 417.012V271.059H1927.15V225.599H1968.3V151.426H2036.25V225.599Z" fill="#37A6E6"/>
            <path d="M964.712 131.328H1039.84V473H964.712V131.328ZM1184.8 225.599H1234.57V271.059H1184.8V393.564C1184.8 405.048 1186.71 412.705 1190.54 416.533C1194.37 420.361 1202.03 422.276 1213.51 422.276C1217.34 422.276 1221.01 422.116 1224.52 421.797C1228.03 421.478 1231.38 420.999 1234.57 420.361V473C1228.83 473.957 1222.44 474.595 1215.43 474.914C1208.41 475.233 1201.55 475.393 1194.85 475.393C1184.32 475.393 1174.27 474.595 1164.7 473C1155.45 471.724 1147.16 469.012 1139.82 464.865C1132.8 460.718 1127.22 454.816 1123.07 447.159C1118.92 439.503 1116.85 429.454 1116.85 417.012V271.059H1075.69V225.599H1116.85V151.426H1184.8V225.599ZM1898.54 473H1833.94V438.546H1832.51C1823.89 452.902 1812.73 463.27 1799.01 469.65C1785.29 476.031 1771.25 479.221 1756.9 479.221C1738.71 479.221 1723.72 476.828 1711.92 472.043C1700.43 467.258 1691.34 460.558 1684.64 451.945C1677.94 443.012 1673.15 432.325 1670.28 419.883C1667.73 407.122 1666.45 393.085 1666.45 377.772V225.599H1734.41V365.33C1734.41 385.748 1737.6 401.061 1743.98 411.269C1750.36 421.159 1761.68 426.104 1777.95 426.104C1796.46 426.104 1809.85 420.68 1818.15 409.834C1826.44 398.668 1830.59 380.484 1830.59 355.281V225.599H1898.54V473ZM2036.25 225.599H2086.02V271.059H2036.25V393.564C2036.25 405.048 2038.17 412.705 2041.99 416.533C2045.82 420.361 2053.48 422.276 2064.96 422.276C2068.79 422.276 2072.46 422.116 2075.97 421.797C2079.48 421.478 2082.83 420.999 2086.02 420.361V473C2080.28 473.957 2073.9 474.595 2066.88 474.914C2059.86 475.233 2053 475.393 2046.3 475.393C2035.77 475.393 2025.72 474.595 2016.15 473C2006.9 471.724 1998.61 469.012 1991.27 464.865C1984.25 460.718 1978.67 454.816 1974.52 447.159C1970.37 439.503 1968.3 429.454 1968.3 417.012V271.059H1927.15V225.599H1968.3V151.426H2036.25V225.599Z" fill="white"/>
            <g filter="url(#filter0_d_12_114)">
              <path d="M128.118 194.494H25.7118V131.328H305.653V194.494H203.247V473H128.118V194.494ZM281.727 301.685C282.684 285.734 286.672 272.495 293.69 261.967C300.709 251.439 309.641 242.985 320.488 236.605C331.335 230.224 343.457 225.758 356.856 223.206C370.574 220.335 384.292 218.899 398.01 218.899C410.452 218.899 423.053 219.856 435.814 221.77C448.575 223.365 460.219 226.715 470.747 231.82C481.275 236.924 489.888 244.102 496.588 253.354C503.287 262.286 506.637 274.249 506.637 289.243V417.969C506.637 429.135 507.275 439.822 508.551 450.03C509.827 460.239 512.06 467.896 515.251 473H446.342C445.066 469.172 443.949 465.343 442.992 461.515C442.354 457.368 441.876 453.221 441.557 449.073C430.71 460.239 417.949 468.055 403.274 472.521C388.599 476.988 373.605 479.221 358.292 479.221C346.488 479.221 335.482 477.785 325.273 474.914C315.064 472.043 306.132 467.577 298.475 461.515C290.819 455.454 284.757 447.797 280.291 438.546C276.144 429.294 274.07 418.288 274.07 405.527C274.07 391.49 276.463 380.005 281.248 371.073C286.353 361.821 292.733 354.483 300.389 349.06C308.365 343.637 317.298 339.649 327.187 337.097C337.396 334.226 347.605 331.992 357.813 330.397C368.022 328.802 378.071 327.526 387.961 326.569C397.851 325.612 406.624 324.176 414.28 322.262C421.937 320.348 427.998 317.636 432.465 314.127C436.931 310.299 439.004 304.876 438.685 297.857C438.685 290.52 437.409 284.777 434.857 280.63C432.624 276.164 429.434 272.814 425.287 270.581C421.458 268.029 416.832 266.433 411.409 265.795C406.305 264.838 400.722 264.36 394.66 264.36C381.262 264.36 370.734 267.231 363.077 272.973C355.421 278.716 350.954 288.286 349.678 301.685H281.727ZM438.685 351.931C435.814 354.483 432.145 356.557 427.679 358.152C423.532 359.428 418.906 360.545 413.802 361.502C409.016 362.459 403.912 363.257 398.489 363.895C393.065 364.533 387.642 365.33 382.219 366.287C377.114 367.244 372.01 368.52 366.906 370.115C362.12 371.711 357.813 373.944 353.985 376.815C350.476 379.367 347.605 382.717 345.372 386.864C343.138 391.011 342.022 396.275 342.022 402.656C342.022 408.717 343.138 413.821 345.372 417.969C347.605 422.116 350.635 425.466 354.464 428.018C358.292 430.251 362.758 431.846 367.863 432.803C372.967 433.76 378.231 434.239 383.654 434.239C397.053 434.239 407.421 432.006 414.759 427.539C422.096 423.073 427.52 417.809 431.029 411.748C434.538 405.367 436.612 398.987 437.25 392.607C438.207 386.226 438.685 381.122 438.685 377.293V351.931ZM561.294 131.328H629.246V473H561.294V131.328ZM688.973 131.328H756.925V314.606L842.582 225.599H922.975L829.662 316.52L933.503 473H851.196L783.244 362.459L756.925 387.821V473H688.973V131.328Z" fill="#37A6E6"/>
              <path d="M964.712 131.328H1039.84V473H964.712V131.328ZM1184.8 225.599H1234.57V271.059H1184.8V393.564C1184.8 405.048 1186.71 412.705 1190.54 416.533C1194.37 420.361 1202.03 422.276 1213.51 422.276C1217.34 422.276 1221.01 422.116 1224.52 421.797C1228.03 421.478 1231.38 420.999 1234.57 420.361V473C1228.83 473.957 1222.44 474.595 1215.43 474.914C1208.41 475.233 1201.55 475.393 1194.85 475.393C1184.32 475.393 1174.27 474.595 1164.7 473C1155.45 471.724 1147.16 469.012 1139.82 464.865C1132.8 460.718 1127.22 454.816 1123.07 447.159C1118.92 439.503 1116.85 429.454 1116.85 417.012V271.059H1075.69V225.599H1116.85V151.426H1184.8V225.599ZM1898.54 473H1833.94V438.546H1832.51C1823.89 452.902 1812.73 463.27 1799.01 469.65C1785.29 476.031 1771.25 479.221 1756.9 479.221C1738.71 479.221 1723.72 476.828 1711.92 472.043C1700.43 467.258 1691.34 460.558 1684.64 451.945C1677.94 443.012 1673.15 432.325 1670.28 419.883C1667.73 407.122 1666.45 393.085 1666.45 377.772V225.599H1734.41V365.33C1734.41 385.748 1737.6 401.061 1743.98 411.269C1750.36 421.159 1761.68 426.104 1777.95 426.104C1796.46 426.104 1809.85 420.68 1818.15 409.834C1826.44 398.668 1830.59 380.484 1830.59 355.281V225.599H1898.54V473ZM2036.25 225.599H2086.02V271.059H2036.25V393.564C2036.25 405.048 2038.17 412.705 2041.99 416.533C2045.82 420.361 2053.48 422.276 2064.96 422.276C2068.79 422.276 2072.46 422.116 2075.97 421.797C2079.48 421.478 2082.83 420.999 2086.02 420.361V473C2080.28 473.957 2073.9 474.595 2066.88 474.914C2059.86 475.233 2053 475.393 2046.3 475.393C2035.77 475.393 2025.72 474.595 2016.15 473C2006.9 471.724 1998.61 469.012 1991.27 464.865C1984.25 460.718 1978.67 454.816 1974.52 447.159C1970.37 439.503 1968.3 429.454 1968.3 417.012V271.059H1927.15V225.599H1968.3V151.426H2036.25V225.599Z" fill="white"/>
            </g>
            <circle cx="1448.22" cy="293.5" r="197.793" fill="#37A6E6"/>
            <path d="M1668.56 517.048L1493.61 428.061L1579.57 342.103L1668.56 517.048Z" fill="#37A6E6"/>
            <circle cx="1349.32" cy="296.69" r="28.712" fill="white"/>
            <circle cx="1547.11" cy="296.69" r="28.712" fill="white"/>
            <circle cx="1445.03" cy="296.69" r="28.712" fill="white"/>
            <defs>
              <filter id="filter0_d_12_114" x="0.18993" y="131.328" width="2111.35" height="398.937" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dy="25.5217"/>
                <feGaussianBlur stdDeviation="12.7609"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_12_114"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_12_114" result="shape"/>
              </filter>
            </defs>
          </svg>
        </div>

        <p className="text-lg mb-6 text-gray-700 max-w-2xl">
          Develop your soft skills with AI-powered workplace scenario practice. 
          Get feedback on your communication style, conflict resolution skills, and body language.
        </p>
        
        <div className="grid md:grid-cols-2 gap-5 mb-6 w-full">
          <div className="bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Practice Conversations</h2>
            <div className="space-y-3 text-left">
              <p className="flex items-start">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold flex-shrink-0 mt-0.5">1</span>
                <span className="text-gray-700">Speak naturally to practice a workplace conflict scenario</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold flex-shrink-0 mt-0.5">2</span>
                <span className="text-gray-700">Get realistic responses from an AI coworker</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold flex-shrink-0 mt-0.5">3</span>
                <span className="text-gray-700">Receive feedback on your communication style and effectiveness</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
            <div className="flex items-center mb-3">
              <h2 className="text-xl font-bold text-gray-800">Body Language Analysis</h2>
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">NEW</span>
            </div>
            <div className="space-y-3 text-left">
              <p className="flex items-start">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex-shrink-0 mt-0.5">1</span>
                <span className="text-gray-700">Enable your camera during practice sessions</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex-shrink-0 mt-0.5">2</span>
                <span className="text-gray-700">AI analyzes your posture, gestures, and facial expressions</span>
              </p>
              <p className="flex items-start">
                <span className="mr-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex-shrink-0 mt-0.5">3</span>
                <span className="text-gray-700">Get personalized tips to improve your non-verbal communication</span>
              </p>
            </div>
          </div>
        </div>

        <Link 
          href="/chat" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
        >
          Start Practice Session
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </main>
      
      <footer className="mt-4 text-gray-500 text-sm">
        © 2024 TalkItOut - Workplace Communication Training
      </footer>
    </div>
  );
} 