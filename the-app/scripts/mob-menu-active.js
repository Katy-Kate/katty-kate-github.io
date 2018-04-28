/**
 * Created by Администратор on 22.05.2017.
 */
<script>
$(document).ready(function(){
    $('.mob-menu-icon').click(function(){
        $('.header__nav').css('display','flex');
    });
    $('.mob-menu-icon').dbclick(function(){
        $('.header__nav').css('display','none');
    });
});
</script>