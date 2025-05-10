import React, { useEffect, useRef } from "react";
import Yik from "@/assets/images/yik-green.svg";


const Logo = ({ width = 100, height = 400 }) => {
  const neonRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (neonRef.current) {
      neonRef.current.style.animation = "none";
      neonRef.current.getBoundingClientRect(); // Trigger reflow
      neonRef.current.style.animation = "";
    }
  }, []);

  // Adjusted path data with vertical centering
  const adjustedPath = "m 16.759366,96.314876 c 0.021,-0.504 1.257,-1.863 2.7465,-3.021 5.0085,-3.8925 9.279,-12.3165 7.86,-15.4995 -0.4785,-1.0695 -0.585,-1.002 -1.863,1.1715 -0.7455,1.269 -2.073,3.207 -2.949,4.305 -2.1225,2.6655 -8.967,8.205 -10.1355,8.205 -1.77,0 -0.9165,-1.5105 2.262,-4.008 3.4965,-2.748 8.748,-8.937 9.861,-11.6235 0.6045,-1.461 0.594,-1.8135 -0.072,-2.481 -0.6885,-0.687 -1.0335,-0.447 -2.991,2.091 -2.832,3.6705 -9.2775,8.697 -11.1525,8.697 -1.8045,0 -0.8925,-1.5045 2.34,-3.8655 3.993,-2.9145 4.89,-3.705 7.0635,-6.2295 1.98,-2.301 2.079,-2.793 0.645,-3.249 -0.774,-0.246 -1.7115,0.2475 -3.531,1.854 -2.61,2.3055 -7.257,5.199 -8.3625,5.2065 -1.6785,0.0135 -0.294,-1.731 3.4665,-4.365 3.8595,-2.7045 6.342,-5.118 6.342,-6.165 0,-0.2475 -0.8085,-0.4515 -1.797,-0.4515 -4.296,0 -6.051,-2.097 -6.051,-7.227 0,-4.191 1.1025,-5.5725 5.112,-6.4065 1.8015,-0.375 4.659,-0.4965 7.161,-0.3045 5.5395,0.4245 6.294,1.14 6.297,5.9715 0.0045,6.0465 -0.693,7.0095 -5.6385,7.7805 -3.315,0.5175 -3.309,1.2675 0.03,3.0495 7.2975,3.897 8.3475,11.4075 2.7945,20.001 -3.1065,4.8045 -9.555,9.2895 -9.438,6.564 z m 8.442,-32.286 c 0.903,-0.363 1.782,-2.208 1.2885,-2.7015 -0.5985,-0.5985 -4.743,-0.8085 -8.9835,-0.4545 -4.206,0.3495 -4.497,0.45 -4.3485,1.4895 0.27,1.869 2.31,2.5335 6.963,2.2665 2.301,-0.1305 4.5885,-0.4005 5.0805,-0.6 z m -2.379,-5.496 4.2705,-0.006 -0.384,-1.4385 -0.384,-1.44 -5.589,-0.147 c -6.255,-0.1665 -7.6785,0.2655 -7.6785,2.3325 0,1.335 0.0525,1.356 2.7465,1.032 1.5105,-0.1815 4.6695,-0.3315 7.0185,-0.3345 z";

  return (
    <div className="logo-container" style={{ width, height }}>
      <style>
        {`
        .logo-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .neon-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          fill: none;
          stroke: #00ff00;
          stroke-width: 0.5;
          filter: drop-shadow(0 0 2px #00ff00) drop-shadow(0 0 4px #00ff00);
          animation: neonPulse 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes neonPulse {
          0%, 100% {
            filter: drop-shadow(0 0 2px #00ff00) drop-shadow(0 0 4px #00ff00);
            stroke-width: 0.5;
          }
          50% {
            filter: drop-shadow(0 0 3px #00ff00) drop-shadow(0 0 6px #00ff00) drop-shadow(0 0 9px #00ff00);
            stroke-width: 1;
          }
        }
      `}
      </style>
      <svg viewBox="0 0 37.5 150" className="neon-effect" ref={neonRef} preserveAspectRatio="xMidYMid meet">
        <path d={adjustedPath} />
      </svg>
    </div>
  );
};

export default Logo;