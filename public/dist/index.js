require("@babel/polyfill");var e=require("axios"),t=require("@stripe/stripe-js");function a(e){return e&&e.__esModule?e.default:e}const o=()=>{let e=document.querySelector(".alert");e&&e.parentElement.removeChild(e)},s=(e,t)=>{o();let a=`<div class="alert alert--${e}">${t}</div>`;document.querySelector("body").insertAdjacentHTML("afterbegin",a),window.setTimeout(o,5e3)},n=async(t,o)=>{try{let n=await a(e)({method:"POST",url:"/api/v1/users/login",data:{email:t,password:o}});"success"===n.data.status&&(s("success","Logged in successfully!"),window.setTimeout(()=>{location.assign("/")},1500))}catch(e){s("error",e.response.data.message)}},r=async()=>{try{let t=await a(e)({method:"GET",url:"/api/v1/users/logout"});"success"===t.data.status&&location.reload(!0)}catch(e){console.log(e.response),s("error","Error logging out! Try again.")}},d=async(t,o)=>{try{let n="password"===o?"/api/v1/users/updateMyPassword":"/api/v1/users/updateMe",r=await a(e)({method:"PATCH",url:n,data:t,headers:{"Content-Type":"multipart/form-data"}});"success"===r.data.status&&(s("success",`${o.toUpperCase()} updated successfully!`),window.setTimeout(()=>{location.assign("/")},1500))}catch(e){s("error",e.response.data.message)}},l=(0,t.loadStripe)("pk_test_51PTpUeBzWNB2TPAl3l6XdAFvRpgUWVaJGdQgJZ6M0Fv3zukfuVOarqkqHk7J8GhUcegKicQ3LW5kKY7uvnhlNI9o00bVCIa9uF"),u=async t=>{try{let o=await a(e)(`/api/v1/bookings/checkout-session/${t}`),s=await l;await s.redirectToCheckout({sessionId:o.data.session.id})}catch(e){console.log(e),s("error",e)}},c=document.getElementById("map"),i=document.querySelector(".form--login"),m=document.querySelector(".nav__el--logout"),p=document.querySelector(".form-user-data"),g=document.querySelector(".form-user-password"),y=document.getElementById("book-tour");c&&(e=>{mapboxgl.accessToken="pk.eyJ1Ijoiam9uYXNzY2htZWR0bWFubiIsImEiOiJjam54ZmM5N3gwNjAzM3dtZDNxYTVlMnd2In0.ytpI7V7w7cyT1Kq5rT9Z1A";var t=new mapboxgl.Map({container:"map",style:"mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy",scrollZoom:!1});let a=new mapboxgl.LngLatBounds;e.forEach(e=>{let o=document.createElement("div");o.className="marker",new mapboxgl.Marker({element:o,anchor:"bottom"}).setLngLat(e.coordinates).addTo(t),new mapboxgl.Popup({offset:30}).setLngLat(e.coordinates).setHTML(`<p>Day ${e.day}: ${e.description}</p>`).addTo(t),a.extend(e.coordinates)}),t.fitBounds(a,{padding:{top:200,bottom:150,left:100,right:100}})})(JSON.parse(c.dataset.locations)),i&&i.addEventListener("submit",e=>{e.preventDefault(),n(document.getElementById("email").value,document.getElementById("password").value)}),m&&m.addEventListener("click",r),p&&p.addEventListener("submit",e=>{e.preventDefault();let t=new FormData;t.append("name",document.getElementById("name").value),t.append("email",document.getElementById("email").value),t.append("photo",document.getElementById("photo").files[0]),d(t,"data")}),g&&g.addEventListener("submit",async e=>{e.preventDefault(),document.querySelector(".btn--save-password").textContent="Updating...";let t=document.getElementById("password-current").value,a=document.getElementById("password").value,o=document.getElementById("password-confirm").value;await d({passwordCurrent:t,password:a,passwordConfirm:o},"password"),document.querySelector(".btn--save-password").textContent="Save password",document.getElementById("password-current").value="",document.getElementById("password").value="",document.getElementById("password-confirm").value=""}),y&&y.addEventListener("click",e=>{e.target.textContent="Processing...";let{tourId:t}=e.target.dataset;u(t)});
//# sourceMappingURL=index.js.map